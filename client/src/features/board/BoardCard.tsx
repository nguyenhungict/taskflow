import React, { useState } from 'react';
import { CheckSquare, Clock, Trash2 } from 'lucide-react';
import TaskDetailModal from '../../components/TaskDetailModal';
import ConfirmModal from '../../components/ConfirmModal';
import { deleteTask } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface Task {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    type: 'bug' | 'feature' | 'task';
    assignee?: {
        name: string;
        avatar: string;
    };
    // New fields
    checklist?: { title: string; isCompleted: boolean }[];
    estimated_hours?: number;
    actual_hours?: number;
}

interface BoardCardProps {
    task: Task;
    onUpdate?: () => void;
    projectMembers?: any[];
}

const BoardCard: React.FC<BoardCardProps> = ({ task, onUpdate, projectMembers = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const toast = useToast();

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-orange-100 text-orange-700';
            case 'low': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Calculate Checklist Progress
    const checklistTotal = task.checklist?.length || 0;
    const checklistCompleted = task.checklist?.filter(item => item.isCompleted).length || 0;

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't open modal if clicking on the more button
        if ((e.target as HTMLElement).closest('button[data-more-button]')) {
            return;
        }
        setIsModalOpen(true);
    };

    const handleDeleteTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteCheck = async () => {
        try {
            await deleteTask(task.id);
            toast.success('Task deleted successfully');
            if (onUpdate) onUpdate();
        } catch (err: any) {
            console.error("Failed to delete task:", err);
            toast.error("Failed to delete task: " + (err.response?.data?.message || err.message));
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <>
            <div
                className="bg-white p-3 rounded-md shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group mb-2"
                onClick={handleCardClick}
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        {task.assignee ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-700 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {task.assignee.name}
                            </div>
                        ) : (
                            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                Unassigned
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <button
                            data-more-button
                            className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            onClick={handleDeleteTask}
                            title="Delete Task"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <h4 className="text-sm font-medium text-slate-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors">
                    {task.title}
                </h4>

                {/* Sub-tasks & Time Tracking Visuals */}
                <div className="flex items-center gap-3 mb-3 text-slate-500">
                    {checklistTotal > 0 && (
                        <div className={`flex items-center gap-1 text-xs ${checklistCompleted === checklistTotal ? 'text-green-600' : ''}`} title="Sub-tasks">
                            <CheckSquare size={14} strokeWidth={2} />
                            <span className="font-medium">{checklistCompleted}/{checklistTotal}</span>
                        </div>
                    )}

                    {(task.estimated_hours || 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs" title="Time Tracking: Actual / Estimated">
                            <Clock size={14} strokeWidth={2} />
                            <span className="font-medium">
                                {task.actual_hours || 0}h / {task.estimated_hours}h
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide uppercase ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        {task.type === 'bug' && (
                            <div className="w-4 h-4 rounded bg-red-100 flex items-center justify-center border border-red-200" title="Bug">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center -space-x-1.5">
                        {task.assignee && (
                            <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200 flex items-center justify-center">
                                <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Detail Modal */}
            <TaskDetailModal
                taskId={task.id}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={onUpdate}
                projectMembers={projectMembers}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Delete Task"
                message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDanger={true}
                onConfirm={confirmDeleteCheck}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </>
    );
};

export default BoardCard;
