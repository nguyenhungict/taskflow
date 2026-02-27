const Task = require('../models/Task');
const Project = require('../models/Project');
const mongoose = require('mongoose');

/**
 * @desc    Get dashboard overview data for current user
 * @route   GET /api/dashboard/overview
 * @access  Private
 */
const getOverview = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get user tasks for stats
        // We fetch all tasks assigned to the user to calculate stats
        const myTasks = await Task.find({ assignee: userId });

        const stats = {
            total: myTasks.length,
            inProgress: myTasks.filter(t => t.status === 'in-progress' || t.status === 'doing').length,
            highPriority: myTasks.filter(t => t.priority === 'high' && t.status !== 'done' && t.status !== 'completed').length,
            completed: myTasks.filter(t => t.status === 'done' || t.status === 'completed').length,
            completedThisMonth: 0 // Placeholder for more complex aggregation if needed
        };

        // Calculate completed this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        stats.completedThisMonth = myTasks.filter(t =>
            (t.status === 'done' || t.status === 'completed') &&
            t.updatedAt >= startOfMonth
        ).length;

        // 2. Get recent tasks (latest assigned or updated)
        const recentTasks = await Task.find({ assignee: userId })
            .populate('project', 'name')
            .sort({ updatedAt: -1 })
            .limit(5);

        // 3. Get recent projects
        const recentProjects = await Project.find({
            $or: [
                { owner: userId },
                { members: userId }
            ]
        })
            .sort({ updatedAt: -1 })
            .limit(3);

        res.status(200).json({
            success: true,
            data: {
                stats,
                recentTasks,
                recentProjects
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getOverview
};
