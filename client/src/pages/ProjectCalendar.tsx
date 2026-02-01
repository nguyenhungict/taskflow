import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ProjectTabs from '../components/ProjectTabs';
import { getProjectById, getTasks } from '../services/api';
import {
    ChevronLeft, ChevronRight, Search, Filter,
    Plus, Info
} from 'lucide-react';

const ProjectCalendar: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Navigation state
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());

    useEffect(() => {
        if (projectId) fetchData(projectId);
    }, [projectId]);

    const fetchData = async (id: string) => {
        try {
            setLoading(true);
            const [projRes, tasksRes] = await Promise.all([
                getProjectById(id),
                getTasks({ project: id })
            ]);
            if (projRes.success) setProject(projRes.data);
            if (tasksRes.success) setTasks(tasksRes.data);
        } catch (error) {
            console.error("Failed to load calendar data", error);
        } finally {
            setLoading(false);
        }
    };

    const goToPreviousMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const goToToday = () => {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
    };

    const { weeks } = useMemo(() => {
        const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
        const paddingDays = firstDayOfMonth.getDay();
        const days = [];
        const startOfGrid = new Date(viewYear, viewMonth, 1 - paddingDays);

        for (let i = 0; i < 42; i++) {
            const date = new Date(startOfGrid);
            date.setDate(startOfGrid.getDate() + i);
            days.push({
                date,
                isCurrentMonth: date.getMonth() === viewMonth,
                isToday: date.toDateString() === new Date().toDateString()
            });
        }

        const weeksArr = [];
        for (let i = 0; i < 42; i += 7) weeksArr.push(days.slice(i, i + 7));
        return { weeks: weeksArr };
    }, [viewYear, viewMonth]);

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        </div>
    );

    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="h-full flex flex-col bg-[#F9FAFB] font-sans text-slate-800 overflow-hidden">
            <ProjectTabs projectName={project?.name || 'Loading...'} />

            {/* --- TOOLBAR --- */}
            <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 z-30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                        <button onClick={goToPreviousMonth} className="p-1.5 hover:bg-slate-50 rounded-md text-slate-500 transition-colors"><ChevronLeft size={18} /></button>
                        <span className="text-sm font-semibold text-slate-800 min-w-[140px] text-center select-none">{monthLabel}</span>
                        <button onClick={goToNextMonth} className="p-1.5 hover:bg-slate-50 rounded-md text-slate-500 transition-colors"><ChevronRight size={18} /></button>
                    </div>
                    <button onClick={goToToday} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">Today</button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input type="text" placeholder="Search tasks..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-64 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400" />
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-all"><Filter size={16} /> Filters</button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm"><Plus size={16} /> Add Task</button>
                </div>
            </div>

            {/* --- CALENDAR --- */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-w-[1000px]">
                    {/* Header */}
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                        {weekdays.map(day => (
                            <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 flex flex-col divide-y divide-slate-100">
                        {weeks.map((week, weekIdx) => {
                            const weekStart = week[0].date;
                            const weekEnd = new Date(week[6].date);
                            weekEnd.setHours(23, 59, 59, 999);

                            // Filter tasks
                            const weekTasks = tasks.filter(task => {
                                if (!task.startDate || !task.dueDate) return false;
                                const start = new Date(task.startDate);
                                const end = new Date(task.dueDate);
                                return (start <= weekEnd && end >= weekStart);
                            });

                            // Pack tasks
                            const taskRows: any[][] = [];
                            // Sort by start date, then duration
                            weekTasks.sort((a, b) => {
                                const diff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                                if (diff !== 0) return diff;
                                return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
                            });

                            weekTasks.forEach(task => {
                                const start = new Date(task.startDate);
                                const end = new Date(task.dueDate);
                                const s = Math.max(0, Math.floor((start.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
                                const e = Math.min(6, Math.floor((end.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
                                const len = (e - s) + 1;

                                let rowIdx = taskRows.findIndex(row => !row.some(t => {
                                    const tS = Math.max(0, Math.floor((new Date(t.startDate).getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
                                    const tE = Math.min(6, Math.floor((new Date(t.dueDate).getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
                                    return (s <= tE && e >= tS);
                                }));

                                if (rowIdx === -1) taskRows.push([{ ...task, s, len }]);
                                else taskRows[rowIdx].push({ ...task, s, len });
                            });

                            return (
                                <div key={weekIdx} className="min-h-[140px] relative transition-colors group/week hover:bg-slate-50/30">
                                    {/* Vertical Dividers */}
                                    <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                        {week.map((cell, i) => (
                                            <div key={i} className={`border-r border-slate-100 last:border-r-0 ${!cell.isCurrentMonth ? 'bg-slate-50/50' : ''}`}></div>
                                        ))}
                                    </div>

                                    {/* Date Header */}
                                    <div className="relative z-10 grid grid-cols-7 pt-2 mb-1">
                                        {week.map((cell, i) => (
                                            <div key={i} className="flex justify-center">
                                                <div className={`w-7 h-7 flex items-center justify-center text-sm rounded-full transition-colors ${cell.isToday
                                                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                                    : cell.isCurrentMonth ? 'text-slate-700 font-medium' : 'text-slate-300 font-normal'
                                                    }`}>
                                                    {cell.date.getDate()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Task Bars */}
                                    <div className="relative z-20 space-y-1 pb-3 px-1">
                                        {taskRows.slice(0, 4).map((row, rI) => (
                                            <div key={rI} className="h-7 relative">
                                                {row.map((task, tI) => (
                                                    <div
                                                        key={`${task._id}-${tI}`}
                                                        className={`absolute h-6 top-0.5 flex items-center px-2 rounded border text-xs cursor-pointer transition-all hover:brightness-95 hover:shadow-sm truncate ${task.status === 'done'
                                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                            : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                            }`}
                                                        style={{
                                                            left: `calc(${(task.s * 100) / 7}%)`,
                                                            width: `calc(${(task.len * 100) / 7}% - 4px)`,
                                                            marginLeft: '2px',
                                                            marginRight: '2px'
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1.5 w-full overflow-hidden">
                                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'done' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                                                            <span className="font-medium truncate">{task.title}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                        {taskRows.length > 4 && (
                                            <div className="w-full text-center">
                                                <span className="text-xs text-slate-400 font-medium cursor-pointer hover:text-indigo-600">
                                                    + {taskRows.length - 4} more
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- BOTTOM BAR --- */}
            <div className="h-12 border-t border-slate-200 bg-white flex items-center justify-between px-6 z-20 text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-2">
                    <Info size={14} />
                    <span>Displaying {tasks.length} tasks synced with roadmap</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> In Progress</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Completed</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectCalendar;
