const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');

/**
 * GET /api/dashboard/attempts
 */
const getAttempts = async (req, res, next) => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        correctCount: true,
        incorrectCount: true,
        skippedCount: true,
        percentage: true,
        timeTaken: true,
        passed: true,
        startedAt: true,
        submittedAt: true,
      },
    });

    // Add rank/position info
    const submitted = attempts.filter((a) => a.submittedAt !== null);

    return success(res, { attempts: submitted }, 'Attempts fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: req.user.id, submittedAt: { not: null } },
      orderBy: { startedAt: 'asc' },
      select: {
        id: true,
        score: true,
        percentage: true,
        correctCount: true,
        incorrectCount: true,
        timeTaken: true,
        passed: true,
        startedAt: true,
        submittedAt: true,
      },
    });

    if (attempts.length === 0) {
      return success(res, {
        totalAttempts: 0,
        highestScore: 0,
        lowestScore: 0,
        averageScore: 0,
        highestPercentage: 0,
        lowestPercentage: 0,
        averagePercentage: 0,
        bestTime: 0,
        averageTime: 0,
        passRate: 0,
        improvement: 0,
        trend: [],
      }, 'Analytics fetched');
    }

    const scores = attempts.map((a) => a.percentage);
    const times = attempts.map((a) => a.timeTaken).filter((t) => t > 0);
    const passedCount = attempts.filter((a) => a.passed).length;

    const last = attempts[attempts.length - 1];
    const prev = attempts.length > 1 ? attempts[attempts.length - 2] : null;
    const improvement = prev ? parseFloat((last.percentage - prev.percentage).toFixed(2)) : 0;

    const trend = attempts.map((a, idx) => ({
      attempt: idx + 1,
      percentage: a.percentage,
      date: a.startedAt,
      passed: a.passed,
    }));

    return success(res, {
      totalAttempts: attempts.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      averageScore: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      highestPercentage: Math.max(...scores),
      lowestPercentage: Math.min(...scores),
      averagePercentage: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      bestTime: times.length ? Math.min(...times) : 0,
      averageTime: times.length ? Math.floor(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      passRate: parseFloat(((passedCount / attempts.length) * 100).toFixed(2)),
      improvement,
      trend,
    }, 'Analytics fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/attempts/:attemptId/review
 */
const getReview = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId: req.user.id },
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
                correctAnswer: true,
                explanation: true,
                sourcePdf: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) return error(res, 'Attempt not found', 404);
    if (!attempt.submittedAt) return error(res, 'Quiz not yet submitted', 400);

    const questions = attempt.answers.map((ans) => {
      const q = ans.question;
      const optionOrder = JSON.parse(ans.optionOrder); // newKey -> originalKey

      const origOptions = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD };
      const shuffledOptions = {
        A: origOptions[optionOrder['A']],
        B: origOptions[optionOrder['B']],
        C: origOptions[optionOrder['C']],
        D: origOptions[optionOrder['D']],
      };

      // Map correct answer to shuffled key
      const reverseMap = {};
      Object.entries(optionOrder).forEach(([newKey, origKey]) => {
        reverseMap[origKey] = newKey;
      });
      const shuffledCorrect = reverseMap[q.correctAnswer];

      return {
        questionId: q.id,
        questionOrder: ans.questionOrder,
        question: q.question,
        options: shuffledOptions,
        selectedAnswer: ans.selectedAnswer,
        correctAnswer: shuffledCorrect,
        isCorrect: ans.isCorrect,
        explanation: q.explanation,
        sourcePdf: q.sourcePdf,
      };
    });

    return success(res, {
      attemptId,
      score: attempt.score,
      percentage: attempt.percentage,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      skippedCount: attempt.skippedCount,
      timeTaken: attempt.timeTaken,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
      totalQuestions: attempt.totalQuestions,
      questions,
    }, 'Review data fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAttempts, getAnalytics, getReview };
