const Task = require('../models/Task');
const Project = require('../models/Project');
const mongoose = require('mongoose');

/**
 * @desc    Get all tasks with filters
 * @route   GET /api/tasks?project=xxx&assignee=xxx&status=xxx&search=xxx
 * @access  Private
 */
const getAllTasks = async (req, res) => {
  try {
    const { project, assignee, status, search, page = 1, limit = 100 } = req.query;

    // Build query object
    const query = {};

    // Filter by project
    if (project) {
      query.project = project;

      // Authorization: User must be member of project
      // WHY: Không cho xem tasks của projects không liên quan
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const isOwner = projectDoc.owner.toString() === req.user.id;
      const isMember = projectDoc.members.some(m => m.toString() === req.user.id);

      if (!isOwner && !isMember) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view tasks of this project'
        });
      }
    } else {
      // If no project filter, only show tasks from user's projects
      // WHY: User chỉ thấy tasks mà mình có quyền access
      const userProjects = await Project.find({
        $or: [
          { owner: req.user.id },
          { members: req.user.id }
        ]
      }).select('_id');

      query.project = { $in: userProjects.map(p => p._id) };
    }

    // Filter by assignee
    if (assignee) {
      query.assignee = assignee;
    }

    // Filter by status
    if (status) {
      if (!['todo', 'in-progress', 'done'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: todo, in-progress, or done'
        });
      }
      query.status = status;
    }

    // Search in title and description
    // WHY: Cho phép search tasks theo keyword
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with populate
    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignee', 'username email avatar')
      .populate('createdBy', 'username email avatar')
      .sort({ status: 1, position: 1 })  // Sort by status first, then position
      .skip(skip)
      .limit(limitNum);

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name owner members')
      .populate('assignee', 'username email avatar')
      .populate('createdBy', 'username email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization: User must be member of task's project
    const isOwner = task.project.owner.toString() === req.user.id;
    const isMember = task.project.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, project, assignee, dueDate } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project is required'
      });
    }

    // Check if project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isOwner = projectDoc.owner.toString() === req.user.id;
    const isMember = projectDoc.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tasks in this project'
      });
    }

    // If assignee provided, check if they are project member
    if (assignee) {
      const isAssigneeMember = projectDoc.members.some(m => m.toString() === assignee);
      if (!isAssigneeMember && assignee !== projectDoc.owner.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a member of the project'
        });
      }
    }

    // Create task
    // WHY: createdBy tracks who created the task (for audit trail)
    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      project,
      assignee: assignee || null,
      createdBy: req.user.id,
      dueDate: dueDate || null,
      // AI fields will be filled later by ML service
      estimated_hours: null,
      actual_hours: null,
      embedding: null
    });

    // Populate before returning
    await task.populate('project', 'name');
    await task.populate('assignee', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update task
 * @route   PATCH /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization: User must be member of task's project
    const isOwner = task.project.owner.toString() === req.user.id;
    const isMember = task.project.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'status', 'priority',
      'assignee', 'startDate', 'dueDate', 'actual_hours', 'checklist'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // If changing assignee, validate they are project member
    if (req.body.assignee) {
      const projectDoc = await Project.findById(task.project._id);
      const isAssigneeMember = projectDoc.members.some(m => m.toString() === req.body.assignee);

      if (!isAssigneeMember && req.body.assignee !== projectDoc.owner.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a member of the project'
        });
      }
    }

    await task.save();

    // Populate before returning
    await task.populate('assignee', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization: User must be project owner or task creator
    // WHY: Chỉ owner/creator mới được xóa task
    const isProjectOwner = task.project.owner.toString() === req.user.id;
    const isTaskCreator = task.createdBy.toString() === req.user.id;

    if (!isProjectOwner && !isTaskCreator) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner or task creator can delete this task'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
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
 * @desc    Update task status (for drag-and-drop)
 * @route   PATCH /api/tasks/:id/status
 * @access  Private
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: todo, in-progress, or done'
      });
    }

    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization
    const isOwner = task.project.owner.toString() === req.user.id;
    const isMember = task.project.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    task.status = status;
    await task.save();

    await task.populate('assignee', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    res.status(200).json({
      success: true,
      message: 'Task status updated',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update task estimated hours (AI prediction endpoint)
 * @route   PATCH /api/tasks/:id/estimate
 * @access  Private (will be called by ML service)
 */
const updateTaskEstimate = async (req, res) => {
  try {
    const { estimated_hours, embedding } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update AI fields
    // WHY: ML service sẽ call endpoint này sau khi predict
    if (estimated_hours !== undefined) {
      task.estimated_hours = estimated_hours;
    }
    if (embedding) {
      task.embedding = embedding;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task AI fields updated',
      data: {
        id: task._id,
        estimated_hours: task.estimated_hours
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add checklist item to task
 * @route   POST /api/tasks/:id/checklist
 * @access  Private
 */
const addChecklistItem = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Checklist item title is required'
      });
    }

    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization
    const isOwner = task.project.owner.toString() === req.user.id;
    const isMember = task.project.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Add new checklist item
    task.checklist.push({
      title: title.trim(),
      isCompleted: false
    });

    await task.save();

    await task.populate('assignee', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    res.status(200).json({
      success: true,
      message: 'Checklist item added',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Toggle checklist item completion status
 * @route   PATCH /api/tasks/:id/checklist/:index/toggle
 * @access  Private
 */
const toggleChecklistItem = async (req, res) => {
  try {
    const { index } = req.params;
    const itemIndex = parseInt(index);

    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization
    const isOwner = task.project.owner.toString() === req.user.id;
    const isMember = task.project.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Validate index
    if (!task.checklist || itemIndex < 0 || itemIndex >= task.checklist.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid checklist item index'
      });
    }

    // Toggle completion
    task.checklist[itemIndex].isCompleted = !task.checklist[itemIndex].isCompleted;
    await task.save();

    await task.populate('assignee', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    res.status(200).json({
      success: true,
      message: 'Checklist item toggled',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update checklist item title
 * @route   PATCH /api/tasks/:id/checklist/:index
 * @access  Private
 */
const updateChecklistItem = async (req, res) => {
  try {
    const { index } = req.params;
    const { title } = req.body;
    const itemIndex = parseInt(index);

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Checklist item title is required'
      });
    }

    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization
    const isOwner = task.project.owner.toString() === req.user.id;
    const isMember = task.project.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Validate index
    if (!task.checklist || itemIndex < 0 || itemIndex >= task.checklist.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid checklist item index'
      });
    }

    // Update title
    task.checklist[itemIndex].title = title.trim();
    await task.save();

    await task.populate('assignee', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    res.status(200).json({
      success: true,
      message: 'Checklist item updated',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete checklist item
 * @route   DELETE /api/tasks/:id/checklist/:index
 * @access  Private
 */
const deleteChecklistItem = async (req, res) => {
  try {
    const { index } = req.params;
    const itemIndex = parseInt(index);

    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization
    const isOwner = task.project.owner.toString() === req.user.id;
    const isMember = task.project.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Validate index
    if (!task.checklist || itemIndex < 0 || itemIndex >= task.checklist.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid checklist item index'
      });
    }

    // Remove item
    task.checklist.splice(itemIndex, 1);
    await task.save();

    await task.populate('assignee', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    res.status(200).json({
      success: true,
      message: 'Checklist item deleted',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Reorder task (for drag-and-drop with FLOAT POSITION)
 * @route   PATCH /api/tasks/:id/reorder
 * @access  Private-
 */
const reorderTask = async (req, res) => {
  try {
    const { newStatus, newPosition } = req.body; // newPosition = index in array (0, 1, 2...)

    console.log(`🎯 REORDER: taskId=${req.params.id}, newStatus=${newStatus}, newPosition=${newPosition}`);

    if (!newStatus || !['todo', 'in-progress', 'done'].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: todo, in-progress, or done'
      });
    }

    if (typeof newPosition !== 'number' || newPosition < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid position. Must be a non-negative number'
      });
    }

    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Authorization
    const isOwner = task.project.owner.toString() === req.user.id;
    const isMember = task.project.members.some(m => m.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Get all tasks in destination column, EXCLUDING the dragged task
    // Sort by position ASC to determine neighbors
    const tasksInDestColumn = await Task.find({
      project: task.project._id,
      status: newStatus,
      _id: { $ne: task._id }
    }).sort({ position: 1 });

    console.log(`📋 Destination Column (${newStatus}) has ${tasksInDestColumn.length} tasks (excluding dragged one).`);

    let newFloatPosition;

    if (tasksInDestColumn.length === 0) {
      // Case 1: Column is empty
      newFloatPosition = 10000; // Start with a safe large number
      console.log('📍 Column empty -> pos: 10000');
    } else if (newPosition === 0) {
      // Case 2: Move to TOP
      const firstTaskPos = tasksInDestColumn[0].position || 0;
      newFloatPosition = firstTaskPos / 2;
      console.log(`📍 Insert at TOP -> pos: ${newFloatPosition} (Next item pos: ${firstTaskPos})`);
    } else if (newPosition >= tasksInDestColumn.length) {
      // Case 3: Move to BOTTOM
      const lastTaskPos = tasksInDestColumn[tasksInDestColumn.length - 1].position || 0;
      newFloatPosition = lastTaskPos + 10000;
      console.log(`📍 Insert at BOTTOM -> pos: ${newFloatPosition} (Prev item pos: ${lastTaskPos})`);
    } else {
      // Case 4: Move between two tasks
      const prevTask = tasksInDestColumn[newPosition - 1]; // Task above
      const nextTask = tasksInDestColumn[newPosition];     // Task below

      const prevPos = prevTask.position || 0;
      const nextPos = nextTask.position || 0;

      newFloatPosition = (prevPos + nextPos) / 2;
      console.log(`📍 Insert MIDDLE -> pos: ${newFloatPosition} (Between ${prevPos} and ${nextPos})`);
    }

    // Safety check: verify position is valid number
    if (isNaN(newFloatPosition)) {
      newFloatPosition = Date.now(); // Fallback to avoid error
    }

    // Update the task
    task.status = newStatus;
    task.position = newFloatPosition;
    await task.save();

    console.log(`✅ Saved: ${task.title} -> ${newStatus} @ ${newFloatPosition}`);

    // Populate before returning
    await task.populate('assignee', 'username email avatar');
    await task.populate('createdBy', 'username email avatar');

    res.status(200).json({
      success: true,
      message: 'Task reordered successfully',
      data: task
    });
  } catch (error) {
    console.error(`❌ REORDER ERROR:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  reorderTask,
  updateTaskEstimate,
  addChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
  deleteChecklistItem
};
