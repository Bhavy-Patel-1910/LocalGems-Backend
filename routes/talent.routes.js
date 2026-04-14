const express = require('express');
const router = express.Router();
const { upsertProfile, searchTalent, getTalentById, getMyProfile } = require('../controllers/talent.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/search', searchTalent);
router.get('/me', protect, authorize('talent'), getMyProfile);
router.post('/profile', protect, authorize('talent'), upsertProfile);
router.get('/:id', getTalentById);

module.exports = router;
