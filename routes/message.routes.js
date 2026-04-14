const express = require('express');
const router = express.Router();
const { getConversation, sendMessage, getConversations } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getConversations);
router.get('/:userId', getConversation);
router.post('/', sendMessage);

module.exports = router;
