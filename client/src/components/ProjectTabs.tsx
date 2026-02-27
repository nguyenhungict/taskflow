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
    Plus,
    Users
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { getProjectById } from '../services/api';

interface ProjectTabsProps {
    projectName: string;
    onManageMembers?: () => void;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({ projectName, onManageMembers }) => {
    const { projectId } = useParams();
    const location = useLocation();
    const { onlineUsers } = useSocket();
    const [projectMembers, setProjectMembers] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (projectId) {
            getProjectById(projectId).then(res => {
                if (res.success && res.data?.members) {
                    setProjectMembers(res.data.members);
                }
            }).catch(console.error);
        }
    }, [projectId]);

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
                    {/* Render member avatars */}
                    <div className="flex -space-x-2 mr-2">
                        {projectMembers.map((member: any) => {
                            const isOnline = onlineUsers.has(member._id);
                            return (
                                <div key={member._id} className="relative w-8 h-8 rounded-full border-2 border-white overflow-visible bg-indigo-100 flexitems-center justify-center text-indigo-700 font-bold text-xs" title={member.username}>
                                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            member.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {isOnline && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {onManageMembers && (
                        <button
                            onClick={onManageMembers}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                            title="Manage Members"
                        >
                            <Users size={16} />
                            <span>Members</span>
                        </button>
                    )}
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors" title="Share Project">
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
