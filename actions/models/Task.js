const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Relations
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Task must belong to a project']
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Checklist Sub-tasks
  checklist: [{
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    _id: false // Lightweight, no need for individual IDs unless you want to track them separately
  }],

  // AI Fields for ML integration
  embedding: {
    type: [Number],
    default: null,
    select: false // Don't return by default (large array)
  },
  estimated_hours: {
    type: Number,
    min: 0,
    default: 0 // Will be filled by AI prediction or manual
  },
  actual_hours: {
    type: Number,
    min: 0,
    default: 0 // Filled by user time tracking
  },

  // Dates
  startDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },

  // Position for drag-drop ordering (within the same status)
  position: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'tasks',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp before save
taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
taskSchema.index({ project: 1, status: 1, position: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Task', taskSchema);
