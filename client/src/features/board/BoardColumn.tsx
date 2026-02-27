import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface BoardColumnProps {
    title: string;
    count: number;
    onCreateClick?: () => void;
    onDeleteClick?: () => void;
    children: React.ReactNode;
}

const BoardColumn: React.FC<BoardColumnProps> = ({ title, count, onCreateClick, onDeleteClick, children }) => {
    return (
        <div className="flex flex-col h-full w-[280px] shrink-0 bg-slate-50 rounded-lg p-2 max-h-full">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-3 mb-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {title}
                    </h3>
                    <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {count}
                    </span>
                </div>
                <div className="flex gap-1">
                    <button className="text-slate-400 hover:bg-slate-200 p-1 rounded transition-colors" onClick={onCreateClick}>
                        <Plus size={14} />
                    </button>
                    {onDeleteClick && (
                        <button className="text-slate-400 hover:bg-red-100 hover:text-red-500 p-1 rounded transition-colors" onClick={onDeleteClick}>
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Add Button (Matching Screenshot) */}
            <button className="flex items-center gap-2 w-full px-2 py-2 mb-2 text-sm text-slate-500 hover:bg-slate-100 rounded transition-colors group" onClick={onCreateClick}>
                <Plus size={16} className="text-slate-400 group-hover:text-blue-500" />
                <span className="font-medium group-hover:text-blue-600">Create</span>
            </button>

            {/* Cards container */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div className="space-y-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BoardColumn;
