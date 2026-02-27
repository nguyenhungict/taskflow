import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight,
    Briefcase,
    CheckSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardOverview } from '../services/api';

const Overview: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        stats: {
            total: number,
            inProgress: number,
            highPriority: number,
            completed: number,
            completedThisMonth: number
        },
        recentTasks: any[],
        recentProjects: any[]
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await getDashboardOverview();
                if (res.success) {
                    setData(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'done' || s === 'completed') return 'bg-green-100 text-green-700';
        if (s === 'in-progress' || s === 'doing' || s === 'in progress') return 'bg-blue-100 text-blue-700';
        return 'bg-slate-100 text-slate-700';
    };

    const formatDueDate = (date: string | null) => {
        if (!date) return 'No date';
        const d = new Date(date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const { stats, recentTasks, recentProjects } = data || {
        stats: { total: 0, inProgress: 0, highPriority: 0, completed: 0, completedThisMonth: 0 },
        recentTasks: [],
        recentProjects: []
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">
            {/* Welcome Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">My Work</h1>
                <p className="text-slate-500">Welcome back, {user?.username || 'User'}. Here's what's happening today.</p>
            </div>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm">Total Tasks</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CheckSquare size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                    <div className="text-xs text-slate-400 mt-1">Assigned to you</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm">In Progress</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.inProgress}</div>
                    <div className="text-xs text-slate-400 mt-1">Active right now</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm">High Priority</span>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.highPriority}</div>
                    <div className="text-xs text-slate-400 mt-1">Needs attention</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm">Completed</span>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{stats.completedThisMonth}</div>
                    <div className="text-xs text-slate-400 mt-1">This month</div>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Task List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Recent Tasks</h2>
                        <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            View all <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {recentTasks.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                                <p>No tasks assigned to you yet.</p>
                            </div>
                        ) : (
                            recentTasks.map((task, index) => (
                                <div
                                    key={task._id}
                                    className={`p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${index !== recentTasks.length - 1 ? 'border-b border-slate-100' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className={`mt-1 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'done' || task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent'
                                            }`}>
                                            <CheckCircle2 size={14} fill={task.status === 'done' || task.status === 'completed' ? 'white' : 'none'} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`font-medium text-slate-900 mb-1 truncate ${task.status === 'done' || task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                                                {task.title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1 truncate">
                                                    <Briefcase size={12} /> {task.project?.name || 'No Project'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                        <div className={`text-[11px] font-bold px-2 py-1 rounded border ${formatDueDate(task.dueDate) === 'Today' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            formatDueDate(task.dueDate) === 'Yesterday' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}>
                                            {formatDueDate(task.dueDate)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Col: Recent Projects & Activity */}
                <div className="space-y-8">
                    {/* Recent Projects Mini List */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Projects</h2>
                        <div className="space-y-3">
                            {recentProjects.length === 0 ? (
                                <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-400 text-sm">
                                    No projects found.
                                </div>
                            ) : (
                                recentProjects.map((project, idx) => {
                                    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
                                    const bgColor = colors[idx % colors.length];
                                    const key = project.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                                    return (
                                        <Link
                                            key={project._id}
                                            to={`/projects/${project._id}/board`}
                                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                                        >
                                            <div className={`w-8 h-8 rounded ${bgColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                {key}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 truncate">{project.name}</h4>
                                                <p className="text-[11px] text-slate-500">{project.members?.length || 0} Members</p>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                        <Link to="/projects" className="inline-block mt-4 text-sm text-blue-600 font-medium hover:underline">
                            View all projects
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
