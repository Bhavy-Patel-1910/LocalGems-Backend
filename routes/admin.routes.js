const express = require('express');
const router = express.Router();
const { getAnalytics, getPendingProfiles, updateProfileStatus, getAllUsers, toggleUserStatus, toggleFeature } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');

// For simplicity: protect all admin routes with JWT; add isAdmin field to User for full prod use
router.use(protect);
router.get('/analytics', getAnalytics);
router.get('/talent/pending', getPendingProfiles);
router.put('/talent/:id/status', updateProfileStatus);
router.put('/talent/:id/feature', toggleFeature);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);

module.exports = router;
