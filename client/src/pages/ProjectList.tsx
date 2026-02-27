import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, MoreHorizontal } from 'lucide-react';
import { getProjects, createProject } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Project {
    _id: string;
    name: string;
    description?: string;
    owner: {
        username: string;
        avatar?: string;
    };
}

const ProjectList: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const toast = useToast();

    // Helper arrays for random UI enhancement
    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-orange-600', 'bg-pink-600', 'bg-indigo-600'];
    const categories = ['Software', 'Business', 'Marketing', 'Internal'];

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await getProjects();
            if (response && response.success) {
                // Transform backend data to UI format
                const mappedProjects = response.data.map((p: Project, index: number) => ({
                    id: p._id,
                    name: p.name,
                    key: p.name.substring(0, 2).toUpperCase(),
                    lead: p.owner?.username || 'Unknown',
                    category: categories[index % categories.length], // Creating variety
                    iconColor: colors[index % colors.length],
                    stats: { open: Math.floor(Math.random() * 20), done: Math.floor(Math.random() * 50) }, // Mock stats for now
                    description: p.description || 'No description provided.'
                }));
                setProjects(mappedProjects);
            }
        } catch (err) {
            setError('Failed to load projects.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = async () => {
        // Temp: Simple prompt creation for demo
        const name = prompt('Enter project name:');
        if (name) {
            try {
                await createProject({ name, description: 'New project' });
                toast.success('Project created successfully');
                fetchProjects(); // Reload list
            } catch (err) {
                toast.error('Failed to create project');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Projects</h1>
                    <p className="text-slate-500">Manage your organization's projects and teams</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm cursor-pointer"
                >
                    <Plus size={18} />
                    Create Project
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                </div>
                <select className="bg-white border border-slate-200 rounded-md py-2 px-3 text-sm text-slate-600 focus:outline-none focus:border-blue-400">
                    <option>All Categories</option>
                    <option>Software</option>
                    <option>Marketing</option>
                    <option>Business</option>
                </select>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        to={`/projects/${project.id}/board`}
                        className="group bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-md ${project.iconColor} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                                    {project.key}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                        {project.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">{project.category} Project</p>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>

                        <p className="text-slate-600 text-sm mb-6 line-clamp-2 h-10">
                            {project.description}
                        </p>

                        {/* Project Stats Footer */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5" title="Lead">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 border border-white">
                                        {project.lead.charAt(0)}
                                    </div>
                                    <span>{project.lead.split(' ')[0]}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1" title="Open Issues">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="font-medium">{project.stats.open} open</span>
                                </div>
                                <div className="flex items-center gap-1" title="Done Issues">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="font-medium">{project.stats.done} done</span>
                                </div>
                            </div>
                        </div>

                        {/* Hover visual cue */}
                        <div className="h-1 w-0 bg-blue-600 absolute bottom-0 left-0 rounded-bl-lg rounded-br-lg transition-all duration-300 group-hover:w-full"></div>
                    </Link>
                ))}

                {/* Create New Project Card Placeholder */}
                <button
                    onClick={handleCreateNew}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all h-full min-h-[200px] gap-3"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium">Create New Project</span>
                </button>
            </div>
        </div>
    );
};

export default ProjectList;
