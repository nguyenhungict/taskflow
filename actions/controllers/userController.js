const User = require('../models/User');
const Project = require('../models/Project');

/**
 * @desc    Search users by username or email
 * @route   GET /api/users/search?q=xyz
 * @access  Private
 */
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        })
            .select('_id username email avatar role')
            .limit(10);

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Get all users who share at least one project with the current user
 * @route   GET /api/users/contacts
 * @access  Private
 */
const getContacts = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all projects where the current user is a member
        const projects = await Project.find({ members: userId })
            .select('name description members')
            .populate('members', '_id username email avatar role');

        // Transform into a team-centric structure
        const teams = projects.map(project => ({
            _id: project._id,
            name: project.name,
            members: project.members.filter(m => m._id.toString() !== userId.toString())
        }));

        res.status(200).json({
            success: true,
            data: teams
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    searchUsers,
    getContacts
};
