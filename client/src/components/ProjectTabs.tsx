import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
    Layout,
    Columns,
    List,
    Calendar,
    MousePointer2,
    FileText,
    Paperclip,
    BarChart3,
    Box,
    Share2,
    Zap,
    Maximize2,
    Plus
} from 'lucide-react';

interface ProjectTabsProps {
    projectName: string;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({ projectName }) => {
    const { projectId } = useParams();
    const location = useLocation();

    const tabs = [
        { id: 'summary', label: 'Summary', icon: <MousePointer2 size={16} />, path: `/projects/${projectId}/summary` },
        { id: 'board', label: 'Board', icon: <Columns size={16} />, path: `/projects/${projectId}/board` },
        { id: 'list', label: 'List', icon: <List size={16} />, path: `/projects/${projectId}/list` },
        { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} />, path: `/projects/${projectId}/calendar` },
    ];

    const currentTab = location.pathname.split('/').pop();

    return (
        <div className="bg-white border-b border-slate-200 pt-4 px-6">
            {/* Top Header Row */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-600 rounded text-white overflow-hidden">
                        <Layout size={18} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">{projectName}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                        <Share2 size={18} />
                    </button>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                        <Zap size={18} />
                    </button>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Tabs Row */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <Link
                        key={tab.id}
                        to={tab.path}
                        className={`flex items-center gap-2 px-3 py-2 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${currentTab === tab.id
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ProjectTabs;
