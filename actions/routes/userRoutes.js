const express = require('express');
const router = express.Router();
const { searchUsers, getContacts } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/search', protect, searchUsers);
router.get('/contacts', protect, getContacts);

module.exports = router;
