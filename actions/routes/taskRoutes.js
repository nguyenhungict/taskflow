const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// ==================================================================
// All routes require authentication
// ==================================================================

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks with filters
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *         description: Filter by project ID
 *       - in: query
 *         name: assignee
 *         schema: { type: string }
 *         description: Filter by assignee ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in-progress, done] }
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in title/description
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200: { description: List of tasks }
 */
router.get('/', protect, getAllTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task details }
 *       404: { description: Task not found }
 */
router.get('/:id', protect, getTaskById);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create new task
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, project]
 *             properties:
 *               title: { type: string, example: "Fix login bug" }
 *               description: { type: string, example: "Users cannot login" }
 *               project: { type: string, example: "60d5ec49f1b2c72b8c8e4f1a" }
 *               assignee: { type: string, example: "60d5ec49f1b2c72b8c8e4f1b" }
 *               status: { type: string, enum: [todo, in-progress, done], default: todo }
 *               priority: { type: string, enum: [low, medium, high], default: medium }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201: { description: Task created }
 *       400: { description: Validation error }
 */
router.post('/', protect, createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in-progress, done] }
 *               priority: { type: string, enum: [low, medium, high] }
 *               assignee: { type: string }
 *               dueDate: { type: string, format: date-time }
 *               actual_hours: { type: number }
 *     responses:
 *       200: { description: Task updated }
 */
router.patch('/:id', protect, updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete task
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Task deleted }
 *       403: { description: Only project owner or task creator can delete }
 */
router.delete('/:id', protect, deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task status (for drag-and-drop)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [todo, in-progress, done] }
 *     responses:
 *       200: { description: Status updated }
 */
router.patch('/:id/status', protect, updateTaskStatus);

/**
 * @swagger
 * /api/tasks/{id}/estimate:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update AI prediction (called by ML service)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estimated_hours: { type: number, example: 5.5 }
 *               embedding: { type: array, items: { type: number } }
 *     responses:
 *       200: { description: AI fields updated }
 */
router.patch('/:id/estimate', protect, updateTaskEstimate);

/**
 * @swagger
 * /api/tasks/{id}/reorder:
 *   patch:
 *     tags: [Tasks]
 *     summary: Reorder task with position (for drag-and-drop)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newStatus, newPosition]
 *             properties:
 *               newStatus: { type: string, enum: [todo, in-progress, done] }
 *               newPosition: { type: number, example: 2 }
 *     responses:
 *       200: { description: Task reordered successfully }
 */
router.patch('/:id/reorder', protect, reorderTask);

// ==================================================================
// CHECKLIST MANAGEMENT ROUTES
// ==================================================================

/**
 * @swagger
 * /api/tasks/{id}/checklist:
 *   post:
 *     tags: [Tasks]
 *     summary: Add checklist item to task
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Review requirements" }
 *     responses:
 *       200: { description: Checklist item added }
 */
router.post('/:id/checklist', protect, addChecklistItem);

/**
 * @swagger
 * /api/tasks/{id}/checklist/{index}/toggle:
 *   patch:
 *     tags: [Tasks]
 *     summary: Toggle checklist item completion
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: index
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Checklist item toggled }
 */
router.patch('/:id/checklist/:index/toggle', protect, toggleChecklistItem);

/**
 * @swagger
 * /api/tasks/{id}/checklist/{index}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update checklist item title
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: index
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *     responses:
 *       200: { description: Checklist item updated }
 */
router.patch('/:id/checklist/:index', protect, updateChecklistItem);

/**
 * @swagger
 * /api/tasks/{id}/checklist/{index}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete checklist item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: index
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Checklist item deleted }
 */
router.delete('/:id/checklist/:index', protect, deleteChecklistItem);

// ==================================================================
// ROUTE EXPLANATION:
// ==================================================================
//
// Standard CRUD:
// GET    /api/tasks           → List tasks (with filters)
// GET    /api/tasks/:id       → Get one task
// POST   /api/tasks           → Create task
// PATCH  /api/tasks/:id       → Update task
// DELETE /api/tasks/:id       → Delete task
//
// Special actions:
// PATCH  /api/tasks/:id/status   → Quick status update (for Kanban drag-drop)
// PATCH  /api/tasks/:id/estimate → ML service updates AI fields
//
// WHY separate /status endpoint?
// - Kanban drag-drop chỉ cần update status, không cần full update
// - Faster validation (chỉ check status value)
// - Clear intent trong code
//
// ==================================================================

module.exports = router;
