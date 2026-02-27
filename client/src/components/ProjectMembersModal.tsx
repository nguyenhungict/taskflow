import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, UserMinus, Shield } from 'lucide-react';
import { searchUsers, addProjectMember, removeProjectMember } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';

interface User {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
}

interface ProjectMembersModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    currentMembers: User[];
    ownerId: string;
    onMembersUpdated: () => void;
}

const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
    projectId,
    isOpen,
    onClose,
    currentMembers,
    ownerId,
    onMembersUpdated
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const toast = useToast();
    const { onlineUsers } = useSocket();

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setSearchQuery('');
            setSearchResults([]);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Handle Search
    useEffect(() => {
        const fetchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const response = await searchUsers(searchQuery);
                if (response.success) {
                    setSearchResults(response.data);
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchUsers, 400); // 400ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleAddMember = async (userId: string) => {
        try {
            await addProjectMember(projectId, userId);
            toast.success("Member added to project");
            setSearchQuery('');
            onMembersUpdated();
        } catch (err: any) {
            toast.error("Failed to add member: " + (err.response?.data?.message || err.message));
        }
    };

    const handleRemoveMember = async (userId: string) => {
        try {
            await removeProjectMember(projectId, userId);
            toast.success("Member removed from project");
            onMembersUpdated();
        } catch (err: any) {
            toast.error("Failed to remove member: " + (err.response?.data?.message || err.message));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all animate-slide-up-fade overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">Manage Members</h2>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-6">
                    {/* Add Member Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Add Members</h3>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users by name or email..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Search Results */}
                        {searchQuery.trim() && (
                            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => {
                                        const isAlreadyMember = currentMembers.some(m => m._id === user._id);
                                        const isOnline = onlineUsers.has(user._id);
                                        return (
                                            <div key={user._id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-visible">
                                                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                                                            {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        {isOnline && (
                                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 leading-tight">{user.username}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddMember(user._id)}
                                                    disabled={isAlreadyMember}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all
                                                        ${isAlreadyMember
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'}`}
                                                >
                                                    {isAlreadyMember ? 'Added' : <><UserPlus size={14} /> Add</>}
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-500">No users found matching "{searchQuery}"</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Current Members Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center justify-between">
                            <span>Current Members</span>
                            <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{currentMembers.length}</span>
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                            {currentMembers.map(member => {
                                const isOwner = member._id === ownerId;
                                return (
                                    <div key={member._id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                                                {member.avatar ? <img src={member.avatar} alt="avatar" className="w-full h-full object-cover" /> : member.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900">{member.username}</p>
                                                    {isOwner && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">
                                                            <Shield size={10} /> Owner
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>

                                        {!isOwner && (
                                            <button
                                                onClick={() => handleRemoveMember(member._id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                                                title="Remove Member"
                                            >
                                                <UserMinus size={18} className="group-hover:scale-110 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectMembersModal;
