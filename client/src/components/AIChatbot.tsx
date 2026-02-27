import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { askAIChatbot } from '../services/api';

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

const AIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            content: "Hi! I'm your TaskFlow Assistant. I can help you find high-priority tasks, check deadlines, or summarize your work. How can I help you today?",
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isOpen, isMinimized]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMsg: Message = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setMessage('');
        setIsLoading(true);

        try {
            // Prepare history for API (last 10 messages)
            // Gemini requires history to start with a 'user' message
            let history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            } as any));

            // Find the first index where role is 'user'
            const firstUserIndex = history.findIndex(h => h.role === 'user');
            if (firstUserIndex !== -1) {
                history = history.slice(firstUserIndex);
            } else {
                history = [];
            }

            // Limit to last 10 messages but keep even number to maintain alternating pattern if needed
            // Actually Gemini handles any length as long as it starts with user and alternates
            history = history.slice(-10);

            // Re-verify after slice that it still starts with user
            const finalFirstUserIndex = history.findIndex(h => h.role === 'user');
            if (finalFirstUserIndex !== -1) {
                history = history.slice(finalFirstUserIndex);
            } else {
                history = [];
            }

            const res = await askAIChatbot(message, history);

            if (res.success) {
                const aiMsg: Message = {
                    role: 'ai',
                    content: res.message,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: error.message || "Sorry, I'm having trouble connecting right now.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-lg hover:shadow-indigo-200/50 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 group z-50"
            >
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 overflow-hidden ${isMinimized ? 'h-14' : 'h-[550px]'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-none">TaskFlow Assistant</h3>
                        {!isMinimized && <p className="text-[10px] text-indigo-100 mt-1">AI powered help</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-white/10 rounded-md text-white transition-colors"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-white/10 rounded-md text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Chat Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                        }`}>
                                        <div className="whitespace-pre-wrap">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 max-w-[85%] items-end">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                                        <Bot size={14} />
                                    </div>
                                    <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center h-8">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask about your tasks..."
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!message.trim() || isLoading}
                                className="absolute right-2 top-2 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 active:scale-90 transition-all disabled:opacity-50 disabled:bg-slate-400"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                        <p className="text-[10px] text-center text-slate-400 mt-3">
                            Experimental TaskFlow AI Assistant
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIChatbot;
