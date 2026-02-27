const express = require('express');
const router = express.Router();
const { getConversation, sendDirectMessage, getRecentConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Base route is /api/messages

router.use(protect);

router.get('/recent', getRecentConversations);
router.get('/:userId', getConversation);
router.post('/:userId', sendDirectMessage);

module.exports = router;
