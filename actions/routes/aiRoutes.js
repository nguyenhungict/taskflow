const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All routes here are protected
router.use(protect);

router.post('/chat', chatWithAI);

module.exports = router;
