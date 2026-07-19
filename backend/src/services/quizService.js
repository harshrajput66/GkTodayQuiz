const prisma = require('../utils/prisma');

const QUIZ_COUNT = parseInt(process.env.QUIZ_QUESTIONS_COUNT) || 30;
const PASS_PERCENTAGE = parseFloat(process.env.QUIZ_PASS_PERCENTAGE) || 60;

/**
 * Fisher-Yates shuffle
 */
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Shuffle options for a question while tracking correct answer
 */
const shuffleOptions = (question) => {
  const options = [
    { key: 'A', value: question.optionA },
    { key: 'B', value: question.optionB },
    { key: 'C', value: question.optionC },
    { key: 'D', value: question.optionD },
  ];

  const shuffled = shuffle(options);
  const newMapping = {}; // originalKey -> newKey
  const reverseMapping = {}; // newKey -> originalKey

  shuffled.forEach((opt, idx) => {
    const newKey = ['A', 'B', 'C', 'D'][idx];
    newMapping[opt.key] = newKey;
    reverseMapping[newKey] = opt.key;
  });

  const newCorrect = newMapping[question.correctAnswer];

  return {
    shuffledOptions: {
      A: shuffled[0].value,
      B: shuffled[1].value,
      C: shuffled[2].value,
      D: shuffled[3].value,
    },
    optionOrder: JSON.stringify(reverseMapping), // stored in DB for review
    newCorrectAnswer: newCorrect,
  };
};

/**
 * Generate a new quiz attempt
 */
const generateQuiz = async (userId) => {
  const totalQuestions = await prisma.question.count();
  if (totalQuestions < QUIZ_COUNT) {
    throw Object.assign(
      new Error(`Not enough questions in database. Need ${QUIZ_COUNT}, have ${totalQuestions}.`),
      { statusCode: 400 }
    );
  }

  // Random sample using ORDER BY RANDOM() via raw query
  const questions = await prisma.$queryRaw`
    SELECT id, question, "optionA", "optionB", "optionC", "optionD", "correctAnswer"
    FROM questions
    ORDER BY RANDOM()
    LIMIT ${QUIZ_COUNT}
  `;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      totalQuestions: QUIZ_COUNT,
    },
  });

  // Create attempt answers (without selected answer yet)
  const answersData = questions.map((q, idx) => {
    const { optionOrder } = shuffleOptions(q);
    return {
      attemptId: attempt.id,
      questionId: q.id,
      questionOrder: idx + 1,
      optionOrder,
    };
  });

  await prisma.attemptAnswer.createMany({ data: answersData });

  return { attemptId: attempt.id };
};

/**
 * Get quiz questions for an active attempt (no correct answers or explanations)
 */
const getQuizQuestions = async (attemptId, userId) => {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      answers: {
        orderBy: { questionOrder: 'asc' },
        include: {
          question: {
            select: {
              id: true,
              question: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) throw Object.assign(new Error('Quiz attempt not found'), { statusCode: 404 });
  if (attempt.submittedAt) throw Object.assign(new Error('Quiz already submitted'), { statusCode: 400 });

  const timerMinutes = parseInt(process.env.QUIZ_TIMER_MINUTES) || 30;
  const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
  const totalSeconds = timerMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  const questions = attempt.answers.map((ans) => {
    const q = ans.question;
    const optionOrder = JSON.parse(ans.optionOrder); // newKey -> originalKey

    // Build shuffled options
    const origOptions = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD };
    const shuffledOptions = {
      A: origOptions[optionOrder['A']],
      B: origOptions[optionOrder['B']],
      C: origOptions[optionOrder['C']],
      D: origOptions[optionOrder['D']],
    };

    return {
      questionId: q.id,
      questionOrder: ans.questionOrder,
      question: q.question,
      options: shuffledOptions,
      selectedAnswer: ans.selectedAnswer,
    };
  });

  return {
    attemptId,
    startedAt: attempt.startedAt,
    remainingSeconds,
    totalSeconds,
    totalQuestions: attempt.totalQuestions,
    questions,
  };
};

/**
 * Submit quiz
 */
const submitQuiz = async (attemptId, userId, answers) => {
  // answers: [{ questionId, selectedAnswer }]
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      answers: {
        include: {
          question: {
            select: { id: true, correctAnswer: true },
          },
        },
      },
    },
  });

  if (!attempt) throw Object.assign(new Error('Quiz attempt not found'), { statusCode: 404 });
  if (attempt.submittedAt) throw Object.assign(new Error('Quiz already submitted'), { statusCode: 400 });

  const answerMap = {};
  (answers || []).forEach((a) => {
    answerMap[a.questionId] = a.selectedAnswer;
  });

  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;

  const updateOps = attempt.answers.map((ans) => {
    const optionOrder = JSON.parse(ans.optionOrder); // newKey -> originalKey
    const selectedNew = answerMap[ans.questionId] || null;
    const originalCorrect = ans.question.correctAnswer;

    // Map selected new key back to original key
    const selectedOriginal = selectedNew ? optionOrder[selectedNew] : null;
    const isCorrect = selectedOriginal === originalCorrect;

    if (!selectedNew) skippedCount++;
    else if (isCorrect) correctCount++;
    else incorrectCount++;

    return prisma.attemptAnswer.update({
      where: { id: ans.id },
      data: { selectedAnswer: selectedNew, isCorrect },
    });
  });

  await prisma.$transaction(updateOps);

  const timeTaken = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
  
  // Scoring logic: +1 for correct, -0.25 for incorrect
  const rawScore = correctCount - (incorrectCount * 0.25);
  // Optional: prevent negative overall score if desired, but typically competitive exams allow negative scores. Let's keep it exact.
  
  const percentage = parseFloat(((rawScore / attempt.totalQuestions) * 100).toFixed(2));
  const passed = percentage >= PASS_PERCENTAGE;

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      correctCount,
      incorrectCount,
      skippedCount,
      score: rawScore,
      percentage,
      timeTaken,
      passed,
      submittedAt: new Date(),
    },
  });

  return {
    attemptId,
    score: rawScore,
    totalQuestions: attempt.totalQuestions,
    correctCount,
    incorrectCount,
    skippedCount,
    percentage,
    timeTaken,
    passed,
    submittedAt: updated.submittedAt,
  };
};

module.exports = { generateQuiz, getQuizQuestions, submitQuiz };
