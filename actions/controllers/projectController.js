const Project = require('../models/Project');
const User = require('../models/User');

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private (require login)
 */
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validation: name is required
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        // Create project with automatic owner and members setup
        // WHY: Owner tự động là member đầu tiên để có quyền access project
        const project = await Project.create({
            name,
            description,
            owner: req.user.id,        // User hiện tại (từ JWT middleware)
            members: [req.user.id]     // Owner tự động là member
        });

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Get all projects of current user
 * @route   GET /api/projects
 * @access  Private
 */
const getAllProjects = async (req, res) => {
    try {
        // Find projects where user is owner OR member
        // WHY: User chỉ thấy projects mà mình có quyền access
        const projects = await Project.find({
            $or: [
                { owner: req.user.id },           // Projects mà user là owner
                { members: req.user.id }          // Projects mà user là member
            ]
        })
            .populate('owner', 'username email avatar')      // Load thông tin owner
            .populate('members', 'username email avatar')    // Load thông tin members
            .sort({ createdAt: -1 });                        // Mới nhất lên đầu

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'username email avatar')
            .populate('members', 'username email avatar');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Authorization check: User must be owner or member
        // WHY: Không cho phép user khác xem project không liên quan
        const isOwner = project.owner._id.toString() === req.user.id;
        const isMember = project.members.some(member => member._id.toString() === req.user.id);

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this project'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Update project
 * @route   PATCH /api/projects/:id
 * @access  Private (only owner)
 */
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Authorization: Only owner can update
        // WHY: Tránh members tự ý thay đổi thông tin project
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only project owner can update project'
            });
        }

        // Update only allowed fields
        const { name, description } = req.body;
        if (name) project.name = name;
        if (description !== undefined) project.description = description;

        await project.save();

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (only owner)
 */
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Authorization: Only owner can delete
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only project owner can delete project'
            });
        }

        await project.deleteOne();

        // TODO: Sau này sẽ thêm logic xóa tất cả tasks thuộc project này
        // const Task = require('../models/Task');
        // await Task.deleteMany({ project: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Add member to project
 * @route   POST /api/projects/:id/members/:userId
 * @access  Private (only owner)
 */
const addMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Authorization: Only owner can add members
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only project owner can add members'
            });
        }

        const { userId } = req.params;

        // Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already a member
        // WHY: Tránh duplicate members trong array
        if (project.members.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member of this project'
            });
        }

        // Add member
        project.members.push(userId);
        await project.save();

        // Populate để return full user info
        await project.populate('members', 'username email avatar');

        res.status(200).json({
            success: true,
            message: 'Member added successfully',
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private (only owner)
 */
const removeMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Authorization: Only owner can remove members
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only project owner can remove members'
            });
        }

        const { userId } = req.params;

        // Cannot remove owner
        // WHY: Owner phải luôn là member của project
        if (userId === project.owner.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove project owner from members'
            });
        }

        // Check if user is actually a member
        if (!project.members.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User is not a member of this project'
            });
        }

        // Remove member
        // WHY: filter() tạo array mới không chứa userId cần xóa
        project.members = project.members.filter(
            memberId => memberId.toString() !== userId
        );

        await project.save();

        await project.populate('members', 'username email avatar');

        res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Export all functions
module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember
};