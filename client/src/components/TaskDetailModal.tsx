import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Plus, Trash2, Pencil, Clock } from 'lucide-react';
import {
    getTaskById,
    addChecklistItem,
    toggleChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    updateTask
} from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ChecklistItem {
    title: string;
    isCompleted: boolean;
}

interface Task {
    _id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'in-progress' | 'done';
    checklist?: ChecklistItem[];
    estimated_hours?: number;
    actual_hours?: number;
    assignee?: {
        _id: string;
        username: string;
        email?: string;
        avatar?: string;
    };
    project?: {
        _id: string;
        name: string;
    };
    createdBy?: {
        _id: string;
        username: string;
        avatar?: string;
    };
    dueDate?: string;
    startDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface TaskDetailModalProps {
    taskId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
    projectMembers?: any[];
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, isOpen, onClose, onUpdate, projectMembers = [] }) => {
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const toast = useToast();

    useEffect(() => {
        if (isOpen && taskId) {
            fetchTaskDetails();
        }
    }, [isOpen, taskId]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            const response = await getTaskById(taskId);
            if (response.success) {
                setTask(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch task details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim() || !task) return;

        try {
            const response = await addChecklistItem(task._id, newChecklistItem.trim());
            if (response.success) {
                setTask(response.data);
                setNewChecklistItem('');
                onUpdate?.();
            }
        } catch (error) {
            console.error('Failed to add checklist item:', error);
        }
    };

    const handleToggleChecklistItem = async (index: number) => {
        if (!task) return;

        try {
            const response = await toggleChecklistItem(task._id, index);
            if (response.success) {
                setTask(response.data);
                onUpdate?.();
            }
        } catch (error) {
            console.error('Failed to toggle checklist item:', error);
        }
    };

    const handleUpdateChecklistItem = async (index: number) => {
        if (!editingTitle.trim() || !task) return;

        try {
            const response = await updateChecklistItem(task._id, index, editingTitle.trim());
            if (response.success) {
                setTask(response.data);
                setEditingIndex(null);
                setEditingTitle('');
                onUpdate?.();
            }
        } catch (error) {
            console.error('Failed to update checklist item:', error);
        }
    };

    const handleDeleteChecklistItem = async (index: number) => {
        if (!task) return;

        try {
            const response = await deleteChecklistItem(task._id, index);
            if (response.success) {
                setTask(response.data);
                toast.success('Checklist item deleted');
                onUpdate?.();
            }
        } catch (error) {
            console.error('Failed to delete checklist item:', error);
            toast.error('Failed to delete checklist item');
        }
    };

    const handleUpdateActualHours = async (hours: number) => {
        if (!task) return;

        try {
            const response = await updateTask(task._id, { actual_hours: hours });
            if (response.success) {
                setTask(response.data);
                onUpdate?.();
            }
        } catch (error) {
            console.error('Failed to update actual hours:', error);
        }
    };

    if (!isOpen) return null;

    const checklistCompleted = task?.checklist?.filter(item => item.isCompleted).length || 0;
    const checklistTotal = task?.checklist?.length || 0;
    const progressPercentage = checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-50 text-red-700 border-red-200';
            case 'medium': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'low': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'todo': return 'bg-slate-50 text-slate-700 border-slate-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        // Only close if clicking directly on the overlay (not bubbled from children)
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleUpdateDate = async (field: 'startDate' | 'dueDate', value: string) => {
        if (!task) return;
        try {
            const response = await updateTask(task._id, { [field]: value || null });
            if (response.success) {
                setTask(response.data);
                onUpdate?.();
            }
        } catch (error) {
            console.error(`Failed to update ${field}:`, error);
        }
    };

    const handleUpdateAssignee = async (userId: string) => {
        if (!task) return;
        try {
            const response = await updateTask(task._id, { assignee: userId || null });
            if (response.success) {
                setTask(response.data);
                toast.success('Assignee updated');
                onUpdate?.();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update assignee');
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : task ? (
                    <>
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-6 text-white">
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="pr-12">
                                <h2 className="text-2xl font-medium mb-3">{task.title}</h2>

                                {/* Badges Row */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)} bg-white`}>
                                        {task.status.toUpperCase().replace('-', ' ')}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)} bg-white`}>
                                        {task.priority.toUpperCase()} PRIORITY
                                    </span>
                                    {task.project && (
                                        <span className="px-3 py-1 rounded-full text-xs font-normal bg-white/20 border border-white/30">
                                            {task.project.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="p-8 space-y-6">
                                {/* Metadata Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Assignee Card */}
                                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                                        <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Assigned to</div>
                                        <select
                                            value={task.assignee ? task.assignee._id : ''}
                                            onChange={(e) => handleUpdateAssignee(e.target.value)}
                                            className="w-full text-sm p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                        >
                                            <option value="">Unassigned</option>
                                            {projectMembers.map((member: any) => (
                                                <option key={member._id} value={member._id}>
                                                    {member.username} {member.email ? `(${member.email})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Start Date Card */}
                                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                                        <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Start Date</div>
                                        <input
                                            type="date"
                                            value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => handleUpdateDate('startDate', e.target.value)}
                                            className="w-full text-sm p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                        />
                                    </div>

                                    {/* Due Date Card */}
                                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                                        <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Due Date</div>
                                        <input
                                            type="date"
                                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => handleUpdateDate('dueDate', e.target.value)}
                                            className="w-full text-sm p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                        />
                                    </div>

                                    {/* Created Card */}
                                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                                        <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Created</div>
                                        <div className="text-sm font-medium text-slate-900">
                                            {formatDate(task.createdAt)}
                                        </div>
                                        {task.createdBy && typeof task.createdBy === 'object' && 'username' in task.createdBy && (
                                            <div className="text-xs text-slate-500 mt-1">by {(task.createdBy as any).username}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {task.description && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700 mb-2.5">Description</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                                            {task.description}
                                        </p>
                                    </div>
                                )}

                                {/* Time Tracking */}
                                {(task.estimated_hours || 0) > 0 && (
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock size={18} className="text-amber-600" />
                                            <span className="font-medium text-amber-900">Time Tracking</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-xs text-amber-700 mb-1.5 font-medium">Estimated</div>
                                                <div className="text-3xl font-medium text-amber-900">{task.estimated_hours}h</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-amber-700 mb-1.5 font-medium">Actual</div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        value={task.actual_hours || 0}
                                                        onChange={(e) => handleUpdateActualHours(parseFloat(e.target.value) || 0)}
                                                        className="w-24 px-3 py-1.5 text-xl font-medium border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                                    />
                                                    <span className="text-xl font-medium text-amber-900">h</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checklist Section */}
                                <div className="border-t border-slate-200 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <CheckSquare size={20} className="text-blue-500" />
                                            <h4 className="text-lg font-medium text-slate-900">Sub-tasks</h4>
                                            {checklistTotal > 0 && (
                                                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    {checklistCompleted}/{checklistTotal}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {checklistTotal > 0 && (
                                        <div className="mb-5">
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out"
                                                    style={{ width: `${progressPercentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2 text-right">{Math.round(progressPercentage)}% complete</p>
                                        </div>
                                    )}

                                    {/* Checklist Items */}
                                    <div className="space-y-2 mb-5">
                                        {task.checklist && task.checklist.length > 0 ? (
                                            task.checklist.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50/50 hover:border-slate-300 transition-all group"
                                                >
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => handleToggleChecklistItem(index)}
                                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.isCompleted
                                                            ? 'bg-green-500 border-green-500 shadow-sm'
                                                            : 'border-slate-300 hover:border-green-400'
                                                            }`}
                                                    >
                                                        {item.isCompleted && (
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>

                                                    {/* Title */}
                                                    {editingIndex === index ? (
                                                        <input
                                                            type="text"
                                                            value={editingTitle}
                                                            onChange={(e) => setEditingTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleUpdateChecklistItem(index);
                                                                if (e.key === 'Escape') { setEditingIndex(null); setEditingTitle(''); }
                                                            }}
                                                            onBlur={() => handleUpdateChecklistItem(index)}
                                                            className="flex-1 px-3 py-1.5 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-normal"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span
                                                            className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'
                                                                }`}
                                                            onDoubleClick={() => {
                                                                setEditingIndex(index);
                                                                setEditingTitle(item.title);
                                                            }}
                                                        >
                                                            {item.title}
                                                        </span>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingIndex(index);
                                                                setEditingTitle(item.title);
                                                            }}
                                                            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteChecklistItem(index)}
                                                            className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                                <CheckSquare size={36} className="mx-auto text-slate-300 mb-2" />
                                                <p className="text-sm text-slate-400">No sub-tasks yet. Add one below!</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add New Checklist Item */}
                                    <div className="flex gap-2.5">
                                        <input
                                            type="text"
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newChecklistItem.trim()) {
                                                    handleAddChecklistItem();
                                                }
                                            }}
                                            placeholder="Add a new sub-task..."
                                            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                                        />
                                        <button
                                            onClick={handleAddChecklistItem}
                                            disabled={!newChecklistItem.trim()}
                                            className="px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow"
                                        >
                                            <Plus size={18} />
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-lg font-medium">Task not found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetailModal;
