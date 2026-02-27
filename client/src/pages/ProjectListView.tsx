import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById, getTasks, deleteTask } from '../services/api';
import ProjectTabs from '../components/ProjectTabs';
import { Search, Filter, Plus, Clock, CheckCircle2, Circle, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle, Trash2 } from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';
import ConfirmModal from '../components/ConfirmModal';
import ProjectMembersModal from '../components/ProjectMembersModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { useToast } from '../contexts/ToastContext';

interface Task {
    _id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    type: 'bug' | 'feature' | 'task';
    status: string;
    assignee?: {
        username: string;
        avatar?: string;
    };
    checklist?: { title: string; isCompleted: boolean }[];
    estimated_hours?: number;
    actual_hours?: number;
    createdAt?: string;
}

interface Project {
    _id: string;
    name: string;
    description: string;
    columns?: { id: string; title: string }[];
    members?: any[];
    owner?: any;
}

const PriorityIcon = ({ priority }: { priority: string }) => {
    switch (priority) {
        case 'high': return <ArrowUpCircle size={16} className="text-red-500" />;
        case 'medium': return <ArrowRightCircle size={16} className="text-orange-500" />;
        case 'low': return <ArrowDownCircle size={16} className="text-blue-500" />;
        default: return null;
    }
};

const StatusBadge = ({ status, columns }: { status: string, columns: { id: string, title: string }[] }) => {
    const col = columns.find(c => c.id === status);
    const title = col ? col.title : status;

    let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
    if (status === 'done') colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === 'in-progress' || status === 'inprogress') colorClass = "bg-blue-50 text-blue-700 border-blue-200";
    if (status === 'todo') colorClass = "bg-slate-50 text-slate-700 border-slate-200";

    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border uppercase tracking-wider ${colorClass}`}>
            {title}
        </span>
    );
};

const ProjectListView: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [taskToView, setTaskToView] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    const fetchData = async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const [projRes, taskRes] = await Promise.all([
                getProjectById(projectId),
                getTasks({ project: projectId })
            ]);

            if (projRes.success) setProject(projRes.data);
            if (taskRes.success) {
                const fetchedTasks = Array.isArray(taskRes.data) ? taskRes.data : [];
                setTasks(fetchedTasks);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load project details");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        setTaskToDelete(task);
    };

    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;
        try {
            await deleteTask(taskToDelete._id);
            toast.success("Task deleted successfully");
            fetchData(); // Refresh the list
        } catch (err: any) {
            console.error("Failed to delete task:", err);
            toast.error("Failed to delete task: " + (err.response?.data?.message || err.message));
        } finally {
            setTaskToDelete(null);
        }
    };

    const currentColumns = project?.columns && project.columns.length > 0
        ? project.columns
        : [{ id: 'todo', title: 'To Do' }, { id: 'in-progress', title: 'In Progress' }, { id: 'done', title: 'Done' }];

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 text-slate-600">
                {error || "Project Not Found"}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <ProjectTabs projectName={project.name} />

            {/* List Toolbar */}
            <div className="h-16 flex items-center justify-between px-8 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                <button
                    onClick={() => setIsCreateTaskOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    Create Task
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4 font-semibold">Task Name</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Priority</th>
                                <th className="px-6 py-4 font-semibold">Assignee</th>
                                <th className="px-6 py-4 font-semibold">Est. Time</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map(task => (
                                    <tr
                                        key={task._id}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => setTaskToView(task)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {task.status === 'done' ? (
                                                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                    <Circle size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                                )}
                                                <span className="font-medium text-slate-900 line-clamp-1">{task.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={task.status} columns={currentColumns} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <PriorityIcon priority={task.priority} />
                                                <span className="capitalize text-slate-600 font-medium">{task.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {task.assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] uppercase border border-white shadow-sm overflow-hidden">
                                                        {task.assignee.avatar ? (
                                                            <img src={task.assignee.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            task.assignee.username.charAt(0)
                                                        )}
                                                    </div>
                                                    <span className="text-slate-600">{task.assignee.username}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Clock size={14} />
                                                <span>{task.estimated_hours ? `${task.estimated_hours}h` : '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTask(task, e);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Task"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No tasks found. Click "Create Task" to add one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {projectId && (
                <CreateTaskModal
                    projectId={projectId}
                    isOpen={isCreateTaskOpen}
                    initialStatus={currentColumns[0]?.id || 'todo'}
                    onClose={() => setIsCreateTaskOpen(false)}
                    onTaskCreated={fetchData}
                    projectMembers={project?.members || []}
                />
            )}

            <ConfirmModal
                isOpen={!!taskToDelete}
                title="Delete Task"
                message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDanger={true}
                onConfirm={confirmDeleteTask}
                onCancel={() => setTaskToDelete(null)}
            />

            {projectId && (
                <ProjectMembersModal
                    projectId={projectId}
                    isOpen={isMembersModalOpen}
                    onClose={() => setIsMembersModalOpen(false)}
                    currentMembers={project?.members || []}
                    ownerId={project?.owner?._id || project?.owner || ''}
                    onMembersUpdated={fetchData}
                />
            )}

            {taskToView && (
                <TaskDetailModal
                    taskId={taskToView._id}
                    isOpen={!!taskToView}
                    onClose={() => setTaskToView(null)}
                    onUpdate={fetchData}
                    projectMembers={project?.members || []}
                />
            )}
        </div>
    );
};

export default ProjectListView;
