import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    Layout,
    Search,
    Plus,
    Bell,
    Settings,
    HelpCircle,
    Menu,
    ChevronDown,
    MessageSquare,
    Users,
    Briefcase,
    Home
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Mock Projects Data
    const projects = [
        { id: '1', name: 'Taskflow Platform', key: 'TF' },
        { id: '2', name: 'Mobile App', key: 'MA' },
        { id: '3', name: 'Marketing Site', key: 'MS' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="h-screen flex bg-white overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-16'
                    } bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 fixed h-full z-30`}
            >
                {/* Sidebar Header */}
                <div className="h-14 flex items-center px-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xl overflow-hidden whitespace-nowrap">
                        <div className="p-1 bg-blue-600 rounded text-white flex-shrink-0">
                            <Layout size={20} />
                        </div>
                        <span className={`${!isSidebarOpen && 'hidden'}`}>Taskflow</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-2">

                        {/* Main Menu */}
                        <div className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 ${!isSidebarOpen && 'hidden'}`}>
                            Menu
                        </div>

                        <Link
                            to="/"
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <Home size={20} />
                            <span className={`${!isSidebarOpen && 'hidden'}`}>Overview</span>
                        </Link>

                        <Link
                            to="/projects"
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/projects')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <Briefcase size={20} />
                            <span className={`${!isSidebarOpen && 'hidden'}`}>Projects</span>
                        </Link>

                        {/* Communication Section (Requested) */}
                        <div className={`mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 ${!isSidebarOpen && 'hidden'}`}>
                            Communication
                        </div>

                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                            <Users size={20} className="text-purple-600" />
                            <span className={`${!isSidebarOpen && 'hidden'}`}>Team Chat</span>
                        </button>

                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                            <MessageSquare size={20} className="text-green-600" />
                            <span className={`${!isSidebarOpen && 'hidden'}`}>Direct Messages</span>
                        </button>

                        {/* Projects Section */}
                        <div className={`mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 flex justify-between items-center ${!isSidebarOpen && 'hidden'}`}>
                            <span>Projects</span>
                            <Plus size={14} className="cursor-pointer hover:text-blue-600" />
                        </div>

                        {projects.map(project => (
                            <div
                                key={project.id}
                                className={`group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors`}
                            >
                                <div className="w-5 h-5 bg-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                                    {project.key}
                                </div>
                                <span className={`${!isSidebarOpen && 'hidden'}`}>{project.name}</span>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-200">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className={`flex-1 overflow-hidden ${!isSidebarOpen && 'hidden'}`}>
                            <p className="text-sm font-medium text-slate-900 truncate">{user?.username}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className={`text-slate-400 hover:text-red-500 transition-colors ${!isSidebarOpen && 'hidden'}`}
                            title="Logout"
                        >
                            <Users size={16} /> {/* Should be logout icon but simple works */}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main
                className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'
                    }`}
            >
                {/* Header (Topbar) */}
                <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                            <span className="hover:text-blue-600 cursor-pointer">Projects</span>
                            <span className="text-slate-300">/</span>
                            <span className="font-medium text-slate-900">Taskflow Platform</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative hidden md:block">
                            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 w-64 transition-all"
                            />
                        </div>

                        {/* Action Buttons */}
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                            <HelpCircle size={20} />
                        </button>
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-hidden bg-white relative">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
