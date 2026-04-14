const express = require('express');
const router = express.Router();
const { createBooking, updateBookingStatus, getUserBookings, getBookingById } = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/', authorize('talent_provider'), createBooking);
router.get('/user', getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
