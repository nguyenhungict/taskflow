const Task = require('../models/Task');
const mongoose = require('mongoose');

let cachedCollectionName = null;
let cachedCollection = null;

const getCollection = async () => {
  if (cachedCollection && cachedCollectionName) {
    return cachedCollection;
  }
  
  const db = mongoose.connection.db;
  const possibleCollections = ['tasks', 'task', 'Tasks', 'Task'];
  
  for (const collName of possibleCollections) {
    try {
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      if (count > 0) {
        cachedCollectionName = collName;
        cachedCollection = collection;
        console.log(`Using collection: ${collName} with ${count} documents`);
        return collection;
      }
    } catch (error) {
      continue;
    }
  }
  
  try {
    const allCollections = await db.listCollections().toArray();
    for (const collInfo of allCollections) {
      const collName = collInfo.name;
      if (collName.toLowerCase().includes('task')) {
        const collection = db.collection(collName);
        const count = await collection.countDocuments();
        if (count > 0) {
          cachedCollectionName = collName;
          cachedCollection = collection;
          console.log(`Using collection: ${collName} with ${count} documents`);
          return collection;
        }
      }
    }
  } catch (error) {
    console.error('Error listing collections:', error.message);
  }
  
  const defaultCollection = db.collection('tasks');
  cachedCollectionName = 'tasks';
  cachedCollection = defaultCollection;
  return defaultCollection;
};

const getCollectionName = async () => {
  if (cachedCollectionName) {
    return cachedCollectionName;
  }
  await getCollection();
  return cachedCollectionName || 'tasks';
};

const getAllTasks = async (req, res) => {
  try {
    const { status, sortBy, sortOrder = 'asc', page = 1, limit = 10, search } = req.query;
    
    const collection = await getCollection();
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    const validSortFields = ['title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const tasks = await collection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .toArray();
    
    const total = await collection.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const collection = await getCollection();
    let taskId;
    try {
      taskId = new mongoose.Types.ObjectId(req.params.id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }
    
    const task = await collection.findOne({ _id: taskId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
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

const createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteMultipleTasks = async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of task IDs'
      });
    }
    
    const result = await Task.deleteMany({ _id: { $in: taskIds } });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} task(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, in-progress, completed, or cancelled'
      });
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateMultipleTasksStatus = async (req, res) => {
  try {
    const { taskIds, status } = req.body;
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of task IDs'
      });
    }
    
    if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, in-progress, completed, or cancelled'
      });
    }
    
    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { status, updatedAt: Date.now() }
    );
    
    const updatedTasks = await Task.find({ _id: { $in: taskIds } });
    
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} task(s) updated successfully`,
      modifiedCount: result.modifiedCount,
      data: updatedTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const debugDatabase = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    const tasksCollection = db.collection('tasks');
    const tasksCount = await tasksCollection.countDocuments();
    const sampleTasks = await tasksCollection.find({}).limit(2).toArray();
    
    const taskCollection = db.collection('task');
    const taskCount = await taskCollection.countDocuments();
    
    res.status(200).json({
      success: true,
      database: mongoose.connection.name,
      collections: collectionNames,
      tasksCollection: {
        exists: collectionNames.includes('tasks'),
        count: tasksCount,
        sample: sampleTasks
      },
      taskCollection: {
        exists: collectionNames.includes('task'),
        count: taskCount
      },
      modelCollectionName: Task.collection.name
    });
  } catch (error) {
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
  deleteMultipleTasks,
  updateTaskStatus,
  updateMultipleTasksStatus,
  debugDatabase
};
