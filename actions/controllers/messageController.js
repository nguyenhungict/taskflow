const Message = require('../models/Message');
const User = require('../models/User');
const socket = require('../socket');

// @desc    Get conversation between current user and another user
// @route   GET /api/messages/:userId
// @access  Private
const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'username avatar email')
            .populate('recipient', 'username avatar email');

        // Mark messages as read
        await Message.updateMany(
            { sender: userId, recipient: currentUserId, read: false },
            { $set: { read: true } }
        );

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Send a direct message
// @route   POST /api/messages/:userId
// @access  Private
const sendDirectMessage = async (req, res) => {
    try {
        const { userId } = req.params; // recipient
        const { content } = req.body;
        const currentUserId = req.user._id;

        if (!content || content.trim() === '') {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        const newMessage = await Message.create({
            sender: currentUserId,
            recipient: userId,
            content
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'username avatar email')
            .populate('recipient', 'username avatar email');

        // Socket.io integration to send event to recipient
        const io = socket.getIO();

        // Emit to recipient's personal room
        io.to(userId.toString()).emit('receive_message', populatedMessage);

        // Also emit to sender's own room (to sync multiple tabs/devices)
        io.to(currentUserId.toString()).emit('receive_message', populatedMessage);

        res.status(201).json({ success: true, data: populatedMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get recent conversations array (chat list)
// @route   GET /api/messages/recent/users
// @access  Private
const getRecentConversations = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Find all unique users the current user has chatted with
        const messages = await Message.find({
            $or: [{ sender: currentUserId }, { recipient: currentUserId }]
        }).sort({ createdAt: -1 });

        const userIds = new Set();
        const recentChats = [];

        messages.forEach(msg => {
            const otherUser = msg.sender.toString() === currentUserId.toString()
                ? msg.recipient.toString()
                : msg.sender.toString();

            if (!userIds.has(otherUser)) {
                userIds.add(otherUser);
                recentChats.push({
                    userId: otherUser,
                    lastMessage: msg.content,
                    lastMessageSender: msg.sender.toString(),
                    createdAt: msg.createdAt,
                    unreadCount: msg.sender.toString() === otherUser && !msg.read ? 1 : 0
                });
            } else if (msg.sender.toString() === otherUser && !msg.read) {
                // Count unread messages
                const chat = recentChats.find(c => c.userId === otherUser);
                if (chat) chat.unreadCount += 1;
            }
        });

        // Now populate user details
        const populatedChats = await Promise.all(
            recentChats.map(async (chat) => {
                const user = await User.findById(chat.userId).select('username avatar email');
                if (user) {
                    return { ...chat, user };
                }
                return null;
            })
        );

        res.status(200).json({
            success: true,
            data: populatedChats.filter(c => c !== null)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getConversation,
    sendDirectMessage,
    getRecentConversations
};
