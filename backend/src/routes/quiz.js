const express = require('express');
const router = express.Router();
const { generate, fetchQuestions, submit } = require('../controllers/quizController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/generate', generate);
router.get('/:attemptId/questions', fetchQuestions);
router.post('/:attemptId/submit', submit);

module.exports = router;
