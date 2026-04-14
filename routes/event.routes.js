const express = require('express');
const router = express.Router();
const { createEvent, getEvents, applyToEvent, getMyEvents } = require('../controllers/event.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getEvents);
router.post('/', protect, authorize('talent_provider'), createEvent);
router.get('/my', protect, getMyEvents);
router.post('/:id/apply', protect, authorize('talent'), applyToEvent);

module.exports = router;
