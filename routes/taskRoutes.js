const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  deleteMultipleTasks,
  updateTaskStatus,
  updateMultipleTasksStatus,
  debugDatabase
} = require('../controllers/taskController');

router.get('/debug', debugDatabase);
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.delete('/multiple/delete', deleteMultipleTasks);
router.patch('/:id/status', updateTaskStatus);
router.patch('/multiple/status', updateMultipleTasksStatus);

module.exports = router;
