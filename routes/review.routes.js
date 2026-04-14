const express = require('express');
const router = express.Router();
const { createReview, getTalentReviews } = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, authorize('talent_provider'), createReview);
router.get('/:talentId', getTalentReviews);

module.exports = router;
