const express = require('express');
const router = express.Router();
const socket = require('../socket');

router.get('/online-users', (req, res) => {
    try {
        const onlineUsers = socket.getOnlineUsers();
        res.status(200).json({
            success: true,
            data: onlineUsers
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
