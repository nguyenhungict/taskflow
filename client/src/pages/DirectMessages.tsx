import React, { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Search as SearchIcon, MessageSquare, Phone, Video, Info, Plus, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { getRecentConversations, getConversation, sendDirectMessage, searchUsers, getContacts } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface User {
    _id: string;
    id?: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
}

interface Message {
    _id: string;
    sender: User;
    recipient: User;
    content: string;
    read: boolean;
    createdAt: string;
}

interface Conversation {
    userId: string;
    user: User;
    lastMessage: string;
    lastMessageSender: string;
    createdAt: string;
    unreadCount: number;
}

interface Team {
    _id: string;
    name: string;
    members: User[];
}

const DirectMessages: React.FC = () => {
    const { user } = useAuth();
    const { socket, onlineUsers } = useSocket();
    const toast = useToast();

    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeUser, setActiveUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Contacts state (Grouped by Team)
    const [teams, setTeams] = useState<Team[]>([]);
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'recent' | 'team'>('recent');

    // Search users state
    const [globalSearch, setGlobalSearch] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Search users logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (globalSearch.trim()) {
                setIsSearching(true);
                try {
                    const res = await searchUsers(globalSearch);
                    if (res.success) {
                        setSearchResults(res.data);
                    }
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [globalSearch]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load recent conversations and contacts
    useEffect(() => {
        fetchConversations();
        fetchTeamContacts();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoadingChats(true);
            const res = await getRecentConversations();
            if (res.success) {
                setConversations(res.data);
            }
        } catch (error) {
            console.error('Failed to load conversations', error);
        } finally {
            setLoadingChats(false);
        }
    };

    const fetchTeamContacts = async () => {
        try {
            const res = await getContacts();
            if (res.success) {
                setTeams(res.data);
                // Expand first team by default
                if (res.data.length > 0) {
                    setExpandedTeams(new Set([res.data[0]._id]));
                }
            }
        } catch (error) {
            console.error('Failed to load contacts', error);
        }
    };

    const toggleTeam = (teamId: string) => {
        setExpandedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            return newSet;
        });
    };

    // Load messages when activeUser changes
    useEffect(() => {
        if (activeUser) {
            fetchMessages(activeUser._id);
            setGlobalSearch('');
            setSearchResults([]);

            // Mark conversation as read in the local state
            setConversations(prev =>
                prev.map(c => c.userId === activeUser._id ? { ...c, unreadCount: 0 } : c)
            );
        } else {
            setMessages([]);
        }
    }, [activeUser]);

    const fetchMessages = async (userId: string) => {
        try {
            setLoadingMessages(true);
            const res = await getConversation(userId);
            if (res.success) {
                setMessages(res.data);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Failed to load messages', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Socket listeners for real-time messages
    useEffect(() => {
        if (!socket || !user) return;

        const handleNewMessage = (newMessage: Message) => {
            // Determine if the message belongs to the current open chat
            const currentChatId = String(activeUser?._id || '');
            const senderId = String(newMessage.sender._id || newMessage.sender);
            const recipientId = String(newMessage.recipient._id || newMessage.recipient);

            // Get current user ID robustly
            const myId = String(user?._id || (user as any)?.id || '');

            const isFromCurrentChat = currentChatId !== '' && (
                (senderId === myId && recipientId === currentChatId) ||
                (senderId === currentChatId && recipientId === myId)
            );

            if (isFromCurrentChat) {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
                scrollToBottom();
            }

            // Refresh conversation list to bump recent chat and update unread count
            fetchConversations();
        };

        socket.on('receive_message', handleNewMessage);

        return () => {
            socket.off('receive_message', handleNewMessage);
        };
    }, [socket, activeUser?._id, user?._id]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = messageInput.trim();
        if (!trimmed || !activeUser) return;

        try {
            setMessageInput(''); // Optimistic clear
            const res = await sendDirectMessage(activeUser._id, trimmed);
            if (!res.success) {
                toast.error('Failed to send message');
                setMessageInput(trimmed);
            } else {
                // The message will be added via socket event 'receive_message'
                // which is handled in handleNewMessage
                console.log('Message sent successfully via API, waiting for socket echo');
            }
        } catch (error) {
            toast.error('Failed to send message');
            setMessageInput(trimmed);
            console.error(error);
        }
    };

    const selectUserForChat = (u: User) => {
        setActiveUser(u);
        setGlobalSearch('');
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-full flex bg-white relative overflow-hidden">
            {/* Sidebar List */}
            <div className={`w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 ${activeUser ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="h-20 border-b border-slate-100 px-6 flex items-center justify-between shrink-0">
                    <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight">Chats</h2>
                    <div className="flex gap-2">
                        <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {/* Search & Tabs */}
                <div className="px-4 py-3 space-y-4 shrink-0">
                    <div className="relative">
                        <SearchIcon size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Messenger"
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-500"
                        />

                        {/* Search Dropdown Results */}
                        {globalSearch.trim() && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl z-50 max-h-80 overflow-y-auto p-2">
                                {isSearching ? (
                                    <div className="p-4 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                        Searching...
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-1">
                                        {searchResults.map(u => (
                                            <div
                                                key={u._id}
                                                className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                                                onClick={() => selectUserForChat(u)}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 overflow-hidden relative border-2 border-transparent group-hover:border-blue-200">
                                                    {u.avatar ? <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" /> : u.username.charAt(0).toUpperCase()}
                                                    {onlineUsers.has(u._id) && <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{u.username}</p>
                                                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-400">No results found for "{globalSearch}"</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-all ${activeTab === 'recent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('recent')}
                        >
                            All
                        </button>
                        <button
                            className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-all ${activeTab === 'team' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('team')}
                        >
                            Team
                        </button>
                    </div>
                </div>

                {/* Chat / Team List Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                    {activeTab === 'recent' ? (
                        loadingChats ? (
                            <div className="flex flex-col gap-4 p-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-12 h-12 rounded-full bg-slate-100"></div>
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                                            <div className="h-2 bg-slate-100 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-600">No chats yet</p>
                                <p className="text-xs text-slate-500 mt-1">Chat with project members from the Team tab.</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {conversations.map(chat => {
                                    const myId = String(user?._id || (user as any)?.id || '');
                                    const isOnline = onlineUsers.has(String(chat.user._id));
                                    const isSelected = String(activeUser?._id || '') === String(chat.user._id);
                                    const isSentByMe = String(chat.lastMessageSender) === myId;

                                    return (
                                        <div
                                            key={chat.userId}
                                            onClick={() => selectUserForChat(chat.user)}
                                            className={`w-full flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200 ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="relative w-14 h-14 shrink-0">
                                                <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg overflow-hidden border border-slate-100 shadow-sm">
                                                    {chat.user.avatar ? <img src={chat.user.avatar} alt="avatar" className="w-full h-full object-cover" /> : chat.user.username.charAt(0).toUpperCase()}
                                                </div>
                                                {isOnline && <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className={`text-[15px] truncate pr-2 ${chat.unreadCount > 0 && !isSelected ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'}`}>{chat.user.username}</h3>
                                                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatTime(chat.createdAt)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-[13px] truncate ${chat.unreadCount > 0 && !isSelected ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                                                        {isSentByMe ? 'You: ' : ''}{chat.lastMessage}
                                                    </p>
                                                    {chat.unreadCount > 0 && !isSelected && (
                                                        <div className="shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full ml-2"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        // Team Tab (Grouped by Project)
                        <div className="space-y-2 py-2">
                            {teams.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                                    <p className="text-sm font-semibold text-slate-600">No teammates yet</p>
                                    <p className="text-xs text-slate-500 mt-1">Join or create a project to see your team.</p>
                                </div>
                            ) : (
                                teams.map(team => (
                                    <div key={team._id} className="space-y-1">
                                        <button
                                            onClick={() => toggleTeam(team._id)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Users size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{team.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">{team.members.length}</span>
                                            </div>
                                            {expandedTeams.has(team._id) ? (
                                                <ChevronDown size={18} className="text-slate-400" />
                                            ) : (
                                                <ChevronRight size={18} className="text-slate-400" />
                                            )}
                                        </button>

                                        {expandedTeams.has(team._id) && (
                                            <div className="pl-4 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                                                {team.members.map(member => {
                                                    const isOnline = onlineUsers.has(String(member._id));
                                                    const isSelected = String(activeUser?._id || '') === String(member._id);

                                                    return (
                                                        <div
                                                            key={member._id}
                                                            onClick={() => selectUserForChat(member)}
                                                            className={`w-full flex items-center gap-3 p-2.5 cursor-pointer rounded-xl transition-all duration-200 ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                                        >
                                                            <div className="relative w-10 h-10 shrink-0">
                                                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm overflow-hidden border border-slate-100">
                                                                    {member.avatar ? <img src={member.avatar} alt="avatar" className="w-full h-full object-cover" /> : member.username.charAt(0).toUpperCase()}
                                                                </div>
                                                                {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="text-[13px] font-bold text-slate-800 truncate">{member.username}</h3>
                                                                    {onlineUsers.has(String(member._id)) && (
                                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 truncate">{member.role || 'Member'}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
                {activeUser ? (
                    <>
                        {/* Header */}
                        <div className="h-20 border-b border-slate-100 px-6 flex items-center justify-between bg-white shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveUser(null)}
                                    className="md:hidden p-2 -ml-2 text-blue-600"
                                >
                                    <Send size={20} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <div className="relative w-11 h-11 shrink-0">
                                    <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-lg overflow-hidden border border-slate-100">
                                        {activeUser.avatar ? <img src={activeUser.avatar} alt="avatar" className="w-full h-full object-cover" /> : activeUser.username.charAt(0).toUpperCase()}
                                    </div>
                                    {onlineUsers.has(activeUser._id) && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-slate-900 text-[16px] leading-tight truncate">{activeUser.username}</h2>
                                    <p className="text-[12px] flex items-center gap-1.5">
                                        {onlineUsers.has(activeUser._id) ? (
                                            <span className="text-green-500 font-medium flex items-center gap-1">Active Now</span>
                                        ) : (
                                            <span className="text-slate-400">Offline</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-2.5 text-blue-600 hover:bg-slate-50 rounded-full transition-colors">
                                    <Phone size={20} fill="currentColor" />
                                </button>
                                <button className="p-2.5 text-blue-600 hover:bg-slate-50 rounded-full transition-colors">
                                    <Video size={22} fill="currentColor" />
                                </button>
                                <button className="p-2.5 text-blue-600 hover:bg-slate-50 rounded-full transition-colors">
                                    <Info size={22} fill="currentColor" />
                                </button>
                            </div>
                        </div>

                        {/* Messages List Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white space-y-1 custom-scrollbar">
                            {loadingMessages ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
                                                {activeUser.avatar ? <img src={activeUser.avatar} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-700 text-2xl font-bold">{activeUser.username.charAt(0).toUpperCase()}</div>}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-xl text-slate-900">{activeUser.username}</h3>
                                                <p className="text-sm text-slate-500">You're connected on Messenger</p>
                                            </div>
                                            <button className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[13px] font-bold text-slate-800 transition-colors">
                                                View Profile
                                            </button>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const myId = String(user?._id || (user as any)?.id || '');
                                            const senderId = String(msg.sender._id || msg.sender);
                                            const isMine = senderId === myId;

                                            // Clustering logic for bubbles
                                            const prevMsg = index > 0 ? messages[index - 1] : null;
                                            const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

                                            const isClusterTop = !prevMsg || String(prevMsg.sender._id) !== String(msg.sender._id) || (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 60000);
                                            const isClusterBottom = !nextMsg || String(nextMsg.sender._id) !== String(msg.sender._id) || (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > 60000);

                                            return (
                                                <div key={msg._id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} ${isClusterTop ? 'mt-4' : 'mt-1'}`}>

                                                    {/* Remote Avatar */}
                                                    {!isMine && (
                                                        <div className="w-8 mr-2 shrink-0 self-end mb-1">
                                                            {isClusterBottom ? (
                                                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px] overflow-hidden">
                                                                    {msg.sender.avatar ? <img src={msg.sender.avatar} alt="avatar" className="w-full h-full object-cover" /> : msg.sender.username.charAt(0).toUpperCase()}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )}

                                                    {/* Message Bubble */}
                                                    <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                                                        <div
                                                            className={`px-4 py-2 text-[15px] leading-snug shadow-sm transition-all duration-200 ${isMine
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-slate-100 text-slate-900'
                                                                }`}
                                                            style={{
                                                                borderTopLeftRadius: !isMine && !isClusterTop ? '4px' : '20px',
                                                                borderTopRightRadius: isMine && !isClusterTop ? '4px' : '20px',
                                                                borderBottomLeftRadius: !isMine && !isClusterBottom ? '4px' : '20px',
                                                                borderBottomRightRadius: isMine && !isClusterBottom ? '4px' : '20px',
                                                                wordBreak: 'break-word'
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </div>

                                                        {/* Timestamp on last bubble or cluster end */}
                                                        {isClusterBottom && (
                                                            <span className="text-[10px] text-slate-400 mt-1 mx-1 font-medium">
                                                                {formatTime(msg.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <div className="flex gap-2 text-blue-600 shrink-0">
                                    <button type="button" className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Plus size={20} /></button>
                                </div>
                                <div className="flex-1 relative flex items-center">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Aa"
                                        className="w-full bg-slate-100 border-none rounded-full px-5 py-2.5 text-[15px] focus:outline-none transition-all placeholder:text-slate-500"
                                    />
                                    <button type="button" className="absolute right-3 text-blue-600 hover:scale-110 transition-transform">
                                        😊
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim()}
                                    className={`shrink-0 flex items-center justify-center transition-all ${messageInput.trim() ? 'text-blue-600 hover:scale-110' : 'text-blue-300 cursor-not-allowed'}`}
                                >
                                    <Send size={24} fill="currentColor" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center bg-white text-slate-400 flex-col gap-6 select-none animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-32 h-32 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl relative">
                            <MessageSquare className="w-12 h-12 text-blue-400" />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                                <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-extrabold text-2xl text-slate-800">Your Messages</h3>
                            <p className="text-[15px] text-slate-500 max-w-xs mx-auto px-4 leading-relaxed">
                                Select a conversation to start chatting or find your team members in the side panel.
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveTab('team')}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                        >
                            Open Team Contacts
                        </button>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            ` }} />
        </div>
    );
};

export default DirectMessages;
