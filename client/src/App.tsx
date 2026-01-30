import './styles/App.css'
import { useEffect, useState } from 'react';
import { taskAPI } from './services/api';
import Header from './components/Header';
import TaskCard from './components/TaskCard';
import type { Task } from './types/task';

function App() {
    // State để lưu search query
    const [searchQuery, setSearchQuery] = useState('');

    // Test API connection khi app load
    useEffect(() => {
        taskAPI.getAllTasks()
            .then(res => console.log('✅ API Connected!', res))
            .catch((err: Error) => console.error('❌ API Error:', err));
    }, []);

    // Handler: được gọi từ Header khi user search
    const handleSearch = (query: string) => {
        console.log('🔍 User tìm kiếm:', query);
        setSearchQuery(query);
        // TODO: Filter tasks theo query
    };

    // Handler: được gọi từ Header khi user click Create
    const handleCreateTask = () => {
        console.log('➕ User muốn tạo task mới');
        // TODO: Mở modal tạo task
    };

    // Test task data
    const testTask: Task = {
        _id: '1',
        title: 'Design new homepage',
        description: 'Create wireframes and mockups for the new landing page',
        status: 'in-progress',
        priority: 'medium',
        dueDate: '2026-02-15',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const handleEditTask = (task: Task) => {
        console.log('Edit task:', task);
    };
    const handleDeleteTask = (taskId: string) => {
        console.log('Delete task:', taskId);
    };

    return (
        <div className="App">
            {/* Header với 2 props: onCreateTask và onSearch */}
            <Header
                onCreateTask={handleCreateTask}
                onSearch={handleSearch}
            />

            <div className="content">
                <h1>TaskFlow</h1>

                {/* Task Card */}
                <TaskCard
                    task={testTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                />
            </div>
        </div>
    )
}


export default App
