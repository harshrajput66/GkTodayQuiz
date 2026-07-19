const express = require('express');
const router = express.Router();
const { getAttempts, getAnalytics, getReview } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/attempts', getAttempts);
router.get('/analytics', getAnalytics);
router.get('/attempts/:attemptId/review', getReview);

module.exports = router;
