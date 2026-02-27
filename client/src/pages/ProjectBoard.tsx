import React, { useEffect, useState } from 'react';
import BoardColumn from '../features/board/BoardColumn';
import BoardCard from '../features/board/BoardCard';
import { Filter, Search, Plus, Settings2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getProjectById, getTasks, reorderTask, updateProject } from '../services/api';
import ProjectTabs from '../components/ProjectTabs';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import CreateTaskModal from '../components/CreateTaskModal';
import ProjectMembersModal from '../components/ProjectMembersModal';
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
}

interface Project {
    _id: string;
    name: string;
    description: string;
    members?: Array<{
        _id: string;
        username: string;
        email: string;
        avatar?: string;
    }>;
    columns?: {
        id: string;
        title: string;
    }[];
    owner?: any;
}

const defaultColumns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
];

const ProjectBoard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Record<string, Task[]>>({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [createTaskStatus, setCreateTaskStatus] = useState('todo');

    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    const toast = useToast();

    useEffect(() => {
        if (projectId) {
            fetchProjectData(projectId);
        }
    }, [projectId]);

    const fetchProjectData = async (id: string, isBackground: boolean = false) => {
        try {
            if (!isBackground) {
                setLoading(true);
            }
            setError(null);

            const [projectRes, tasksRes] = await Promise.all([
                getProjectById(id),
                getTasks({ project: id })
            ]);

            if (projectRes.success) {
                setProject(projectRes.data);
            }

            if (tasksRes.success) {
                const allTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
                const normalize = (s: string) => (s || '').toLowerCase();
                const sortByPos = (a: any, b: any) => (a.position || 0) - (b.position || 0);

                const currentColumns = projectRes.data?.columns && projectRes.data.columns.length > 0 ? projectRes.data.columns : defaultColumns;
                const grouped: Record<string, Task[]> = {};

                // Initialize all columns with empty array
                currentColumns.forEach((col: any) => {
                    grouped[col.id] = [];
                });

                allTasks.forEach((t: any) => {
                    const status = normalize(t.status);
                    if (!grouped[status]) {
                        grouped[status] = []; // fallback for tasks not matching any column
                    }
                    grouped[status].push(t);
                });

                Object.keys(grouped).forEach(key => {
                    grouped[key].sort(sortByPos);
                });

                setTasks(grouped);
            }
        } catch (err: any) {
            console.error("Board load error:", err);
            setError(err.message);
        } finally {
            if (!isBackground) {
                setLoading(false);
            }
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) return;

        const sourceStatus = source.droppableId;
        const destStatus = destination.droppableId;

        const newTasks = { ...tasks };
        const sourceColumn = [...(newTasks[sourceStatus] || [])];
        const destColumn = sourceStatus === destStatus
            ? sourceColumn
            : [...(newTasks[destStatus] || [])];

        const [movedTask] = sourceColumn.splice(source.index, 1);

        if (sourceStatus === destStatus) {
            sourceColumn.splice(destination.index, 0, { ...movedTask, status: destStatus });
            newTasks[sourceStatus] = sourceColumn;
        } else {
            destColumn.splice(destination.index, 0, { ...movedTask, status: destStatus });
            newTasks[sourceStatus] = sourceColumn;
            newTasks[destStatus] = destColumn;
        }

        setTasks(newTasks);

        try {
            await reorderTask(draggableId, destStatus, destination.index);
            if (projectId) {
                await fetchProjectData(projectId, true);
            }
        } catch (error) {
            console.error('Failed to reorder task:', error);
            if (projectId) {
                await fetchProjectData(projectId, true);
            }
        }
    };

    const handleAddColumn = async () => {
        if (!newColumnTitle.trim() || !project) return;

        const newColId = newColumnTitle.trim().toLowerCase().replace(/\s+/g, '-');
        const currentColumns = project?.columns && project.columns.length > 0 ? project.columns : defaultColumns;

        // Prevent duplicate IDs
        if (currentColumns.some(c => c.id === newColId)) {
            toast.warning('A column with a similar name already exists.');
            return;
        }

        const newColumns = [...currentColumns, { id: newColId, title: newColumnTitle.trim() }];
        const updatedProject = { ...project, columns: newColumns };

        setProject(updatedProject);
        setTasks(prev => ({ ...prev, [newColId]: [] })); // Optimistic update
        setNewColumnTitle('');
        setIsAddingColumn(false);

        try {
            await updateProject(project._id, { columns: newColumns });
            toast.success('Column added successfully');
        } catch (e) {
            console.error(e);
            if (projectId) await fetchProjectData(projectId, true);
            toast.error('Failed to add column');
        }
    };

    const handleDeleteColumn = async (colId: string) => {
        if (!project) return;

        if (tasks[colId] && tasks[colId].length > 0) {
            toast.warning('Cannot delete a column that contains tasks. Please move or delete the tasks first.');
            return;
        }

        const currentColumns = project?.columns && project.columns.length > 0 ? project.columns : defaultColumns;
        const newColumns = currentColumns.filter(c => c.id !== colId);

        if (newColumns.length === 0) {
            toast.error('A project must have at least one column.');
            return;
        }

        const updatedProject = { ...project, columns: newColumns };
        setProject(updatedProject);

        try {
            await updateProject(project._id, { columns: newColumns });
            toast.success('Column deleted successfully');
        } catch (e) {
            console.error(e);
            if (projectId) await fetchProjectData(projectId, true);
            toast.error('Failed to delete column');
        }
    };

    const openCreateTaskModal = (status: string) => {
        setCreateTaskStatus(status);
        setIsCreateTaskOpen(true);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-500 font-medium">Loading Project...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
                <p className="text-lg font-medium mb-2 text-slate-800">{error || "Project Not Found"}</p>
            </div>
        );
    }

    const currentColumns = project.columns && project.columns.length > 0 ? project.columns : defaultColumns;

    return (
        <div className="h-full flex flex-col bg-white">
            <ProjectTabs
                projectName={project.name}
                onManageMembers={() => setIsMembersModalOpen(true)}
            />

            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search board"
                            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-48 shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex -space-x-2">
                        {project.members?.slice(0, 5).map(member => (
                            <div
                                key={member._id}
                                className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm overflow-hidden"
                                title={member.username}
                            >
                                {member.avatar ? (
                                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                                ) : (
                                    member.username.charAt(0).toUpperCase()
                                )}
                            </div>
                        ))}
                        {project.members && project.members.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                +{project.members.length - 5}
                            </div>
                        )}
                        <button className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>

                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors border border-slate-200">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button
                        onClick={() => openCreateTaskModal(currentColumns[0]?.id || 'todo')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        New Task
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 p-1 rounded-md">
                        <button className="p-1 px-3 bg-white shadow-sm rounded text-xs font-bold text-slate-700 flex items-center gap-2">
                            Group: Status
                        </button>
                    </div>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"><Settings2 size={18} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-50/30 relative min-w-0 min-h-0">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
                        <div className="flex h-full p-6 gap-6 w-max min-w-full">
                            {currentColumns.map((col) => (
                                <Droppable droppableId={col.id} key={col.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="h-full"
                                        >
                                            <BoardColumn
                                                title={col.title}
                                                count={tasks[col.id]?.length || 0}
                                                onCreateClick={() => openCreateTaskModal(col.id)}
                                                onDeleteClick={() => handleDeleteColumn(col.id)}
                                            >
                                                {(tasks[col.id] || []).map((task, index) => (
                                                    <Draggable
                                                        key={task._id}
                                                        draggableId={task._id}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    opacity: snapshot.isDragging ? 0.9 : 1,
                                                                    transform: snapshot.isDragging
                                                                        ? `${provided.draggableProps.style?.transform} rotate(3deg)`
                                                                        : provided.draggableProps.style?.transform
                                                                }}
                                                            >
                                                                <BoardCard
                                                                    task={{
                                                                        id: task._id?.toString() || 'unknown',
                                                                        title: task.title || 'Untitled',
                                                                        priority: task.priority || 'medium',
                                                                        type: task.type || 'task',
                                                                        assignee: task.assignee ? { name: task.assignee.username, avatar: task.assignee.avatar || '' } : undefined,
                                                                        checklist: task.checklist,
                                                                        estimated_hours: task.estimated_hours,
                                                                        actual_hours: task.actual_hours
                                                                    }}
                                                                    onUpdate={() => fetchProjectData(projectId!, true)}
                                                                    projectMembers={project?.members || []}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </BoardColumn>
                                        </div>
                                    )}
                                </Droppable>
                            ))}

                            {/* Add Column Button */}
                            <div className="w-[280px] shrink-0 h-full">
                                {!isAddingColumn ? (
                                    <button
                                        onClick={() => setIsAddingColumn(true)}
                                        className="w-full h-[50px] flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all font-medium text-sm shrink-0"
                                    >
                                        <Plus size={16} />
                                        Add Column
                                    </button>
                                ) : (
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                                        <input
                                            type="text"
                                            value={newColumnTitle}
                                            onChange={(e) => setNewColumnTitle(e.target.value)}
                                            placeholder="Column Title"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddColumn();
                                                if (e.key === 'Escape') setIsAddingColumn(false);
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAddColumn}
                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setIsAddingColumn(false)}
                                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DragDropContext>
            </div>

            {projectId && (
                <CreateTaskModal
                    projectId={projectId}
                    isOpen={isCreateTaskOpen}
                    initialStatus={createTaskStatus}
                    onClose={() => setIsCreateTaskOpen(false)}
                    onTaskCreated={() => fetchProjectData(projectId)}
                    projectMembers={project?.members || []}
                />
            )}

            {projectId && (
                <ProjectMembersModal
                    projectId={projectId}
                    isOpen={isMembersModalOpen}
                    onClose={() => setIsMembersModalOpen(false)}
                    currentMembers={project?.members || []}
                    ownerId={project?.owner?._id || project?.owner || ''}
                    onMembersUpdated={() => fetchProjectData(projectId)}
                />
            )}
        </div>
    );
};

export default ProjectBoard;
