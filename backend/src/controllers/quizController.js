const { generateQuiz, getQuizQuestions, submitQuiz } = require('../services/quizService');
const { success, error } = require('../utils/response');

/**
 * POST /api/quiz/generate
 */
const generate = async (req, res, next) => {
  try {
    const result = await generateQuiz(req.user.id);
    return success(res, result, 'Quiz generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quiz/:attemptId/questions
 */
const fetchQuestions = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const data = await getQuizQuestions(attemptId, req.user.id);
    return success(res, data, 'Questions fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/quiz/:attemptId/submit
 */
const submit = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const result = await submitQuiz(attemptId, req.user.id, answers);
    return success(res, result, 'Quiz submitted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { generate, fetchQuestions, submit };
