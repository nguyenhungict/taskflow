import React from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight,
    Briefcase,
    CheckSquare,
    MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Overview: React.FC = () => {
    const { user } = useAuth();

    // Mock Consolidated Tasks Data (My Work)
    const myTasks = [
        {
            id: 'TF-101',
            title: 'Research competitor analysis',
            project: 'Taskflow Platform',
            projectId: '1',
            status: 'In Progress',
            priority: 'high',
            dueDate: 'Today'
        },
        {
            id: 'MA-24',
            title: 'Fix login screen crash on Android',
            project: 'Mobile App',
            projectId: '2',
            status: 'To Do',
            priority: 'high',
            dueDate: 'Tomorrow'
        },
        {
            id: 'TF-105',
            title: 'Update dependencies to latest versions',
            project: 'Taskflow Platform',
            projectId: '1',
            status: 'Done',
            priority: 'low',
            dueDate: 'Yesterday'
        },
        {
            id: 'MW-09',
            title: 'Content review for blog post',
            project: 'Marketing Site',
            projectId: '3',
            status: 'In Progress',
            priority: 'medium',
            dueDate: 'Feb 12'
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Done': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
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
                    <div className="text-3xl font-bold text-slate-900">12</div>
                    <div className="text-xs text-slate-400 mt-1">Assigned to you</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm">In Progress</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">4</div>
                    <div className="text-xs text-slate-400 mt-1">Active right now</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm">High Priority</span>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">2</div>
                    <div className="text-xs text-slate-400 mt-1">Needs attention</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm">Completed</span>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">45</div>
                    <div className="text-xs text-slate-400 mt-1">This month</div>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Task List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Recent Tasks</h2>
                        <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            View all <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {myTasks.map((task, index) => (
                            <div
                                key={task.id}
                                className={`p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${index !== myTasks.length - 1 ? 'border-b border-slate-100' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${task.status === 'Done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-500 text-transparent'
                                        }`}>
                                        <CheckCircle2 size={14} fill={task.status === 'Done' ? 'white' : 'none'} />
                                    </div>
                                    <div>
                                        <h3 className={`font-medium text-slate-900 mb-1 ${task.status === 'Done' ? 'line-through text-slate-500' : ''}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="font-mono text-slate-400">{task.id}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="flex items-center gap-1">
                                                <Briefcase size={12} /> {task.project}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                        {task.status}
                                    </span>
                                    <div className={`text-xs font-medium px-2 py-1 rounded border ${task.dueDate === 'Today' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        task.dueDate === 'Yesterday' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                        {task.dueDate}
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Col: Recent Projects & Activity */}
                <div className="space-y-8">
                    {/* Recent Projects Mini List */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Projects</h2>
                        <div className="space-y-3">
                            {[
                                { name: 'Taskflow Platform', key: 'TF', color: 'bg-blue-600', link: '/projects/1/board' },
                                { name: 'Mobile Application', key: 'MA', color: 'bg-purple-600', link: '/projects/2/board' },
                                { name: 'Marketing Site', key: 'MW', color: 'bg-emerald-600', link: '/projects/3/board' },
                            ].map(project => (
                                <Link
                                    key={project.key}
                                    to={project.link}
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                                >
                                    <div className={`w-8 h-8 rounded ${project.color} flex items-center justify-center text-white text-xs font-bold`}>
                                        {project.key}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">{project.name}</h4>
                                        <p className="text-xs text-slate-500">Software Project</p>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </Link>
                            ))}
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
