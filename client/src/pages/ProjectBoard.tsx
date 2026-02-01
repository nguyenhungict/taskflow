import React, { useEffect, useState } from 'react';
import BoardColumn from '../features/board/BoardColumn';
import BoardCard from '../features/board/BoardCard';
import { Filter, Search, Plus, Settings2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getProjectById, getTasks, reorderTask } from '../services/api';
import ProjectTabs from '../components/ProjectTabs';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Task {
    _id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    type: 'bug' | 'feature' | 'task';
    status: 'todo' | 'in-progress' | 'done';
    assignee?: {
        username: string;
        avatar?: string;
    };
    // Add for typescript compatibility with new backend fields
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
        avatar?: string;
    }>;
}

const ProjectBoard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<{ todo: Task[]; inProgress: Task[]; done: Task[] }>({
        todo: [],
        inProgress: [],
        done: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

                // Group tasks by status
                // Helper to sort by position
                const sortByPos = (a: any, b: any) => (a.position || 0) - (b.position || 0);

                // Group tasks by status and sort them
                const grouped = {
                    todo: allTasks
                        .filter((t: any) => normalize(t.status) === 'todo')
                        .sort(sortByPos),
                    inProgress: allTasks
                        .filter((t: any) => ['in-progress', 'inprogress', 'in progress'].includes(normalize(t.status)))
                        .sort(sortByPos),
                    done: allTasks
                        .filter((t: any) => normalize(t.status) === 'done')
                        .sort(sortByPos)
                };

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

        // Dropped outside valid droppable area
        if (!destination) return;

        // No position change
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) return;

        // Map droppableId to status string
        const statusMap: Record<string, 'todo' | 'in-progress' | 'done'> = {
            'todo': 'todo',
            'inProgress': 'in-progress',
            'done': 'done'
        };

        const sourceStatus = statusMap[source.droppableId as keyof typeof statusMap];
        const destStatus = statusMap[destination.droppableId as keyof typeof statusMap];

        // OPTIMISTIC UI UPDATE (instant feedback for user)
        const newTasks = { ...tasks };
        const sourceColumn = [...newTasks[source.droppableId as keyof typeof newTasks]];
        const destColumn = source.droppableId === destination.droppableId
            ? sourceColumn
            : [...newTasks[destination.droppableId as keyof typeof newTasks]];

        // Remove from source
        const [movedTask] = sourceColumn.splice(source.index, 1);

        // Insert into destination
        if (source.droppableId === destination.droppableId) {
            sourceColumn.splice(destination.index, 0, { ...movedTask, status: destStatus });
            newTasks[source.droppableId as keyof typeof newTasks] = sourceColumn;
        } else {
            destColumn.splice(destination.index, 0, { ...movedTask, status: destStatus });
            newTasks[source.droppableId as keyof typeof newTasks] = sourceColumn;
            newTasks[destination.droppableId as keyof typeof newTasks] = destColumn;
        }

        setTasks(newTasks); // Update UI immediately

        // BACKEND SYNC
        try {
            await reorderTask(draggableId, destStatus, destination.index);
            // Refresh data in background to ensure accuracy
            if (projectId) {
                await fetchProjectData(projectId, true);
            }
        } catch (error) {
            console.error('Failed to reorder task:', error);
            // Rollback UI on error
            if (projectId) {
                await fetchProjectData(projectId, true);
            }
        }
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

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Project Universal Tabs Header */}
            <ProjectTabs projectName={project.name} />

            {/* Board Specific Toolbar */}
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

            {/* Board Columns Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-50/30">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex h-full gap-6 pb-2">
                        {/* TODO Column */}
                        <Droppable droppableId="todo">
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="min-w-[320px]"
                                >
                                    <BoardColumn
                                        title="To Do"
                                        count={tasks.todo.length}
                                    >
                                        {tasks.todo.map((task, index) => (
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

                        {/* IN PROGRESS Column */}
                        <Droppable droppableId="inProgress">
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="min-w-[320px]"
                                >
                                    <BoardColumn
                                        title="In Progress"
                                        count={tasks.inProgress.length}
                                    >
                                        {tasks.inProgress.map((task, index) => (
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

                        {/* DONE Column */}
                        <Droppable droppableId="done">
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="min-w-[320px]"
                                >
                                    <BoardColumn
                                        title="Done"
                                        count={tasks.done.length}
                                    >
                                        {tasks.done.map((task, index) => (
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

                        {/* Add Column Button */}
                        <button className="min-w-[280px] h-[50px] flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all font-medium text-sm">
                            <Plus size={16} />
                            Add Column
                        </button>
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
};

export default ProjectBoard;
