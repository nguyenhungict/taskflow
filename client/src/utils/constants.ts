import type { TaskStatus, TaskPriority } from '../types/task';

// Status columns for Kanban board
export const TASK_STATUSES: TaskStatus[] = ['pending', 'in-progress', 'completed', 'cancelled'];

// Status display names
export const STATUS_LABELS: Record<TaskStatus, string> = {
    'pending': 'To Do',
    'in-progress': 'In Progress',
    'completed': 'Done',
    'cancelled': 'Cancelled',
};

// Status colors for UI
export const STATUS_COLORS: Record<TaskStatus, string> = {
    'pending': '#64748b',      // Slate
    'in-progress': '#3b82f6',  // Blue
    'completed': '#10b981',    // Green
    'cancelled': '#6b7280',    // Gray
};

// Priority levels
export const PRIORITY_LEVELS: TaskPriority[] = ['low', 'medium', 'high'];

// Priority colors
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
    'low': '#10b981',    // Green
    'medium': '#f59e0b', // Yellow
    'high': '#ef4444',   // Red
};

// Priority labels
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
};
