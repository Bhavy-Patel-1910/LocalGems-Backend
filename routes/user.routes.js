const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/profile', getProfile);
router.put('/update', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
