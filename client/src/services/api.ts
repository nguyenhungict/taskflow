import axios from 'axios';
import type { Task, TasksResponse, SingleTaskResponse, TaskFormData } from '../types/task';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const taskAPI = {
    // Get all tasks with optional filters
    getAllTasks: async (params?: {
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        page?: number;
        limit?: number;
        search?: string;
    }) => {
        const response = await api.get<TasksResponse>('/tasks', { params });
        return response.data;
    },

    // Get task by ID
    getTaskById: async (id: string) => {
        const response = await api.get<SingleTaskResponse>(`/tasks/${id}`);
        return response.data;
    },

    // Create new task
    createTask: async (taskData: TaskFormData) => {
        const response = await api.post<SingleTaskResponse>('/tasks', taskData);
        return response.data;
    },

    // Update task
    updateTask: async (id: string, taskData: Partial<TaskFormData>) => {
        const response = await api.put<SingleTaskResponse>(`/tasks/${id}`, taskData);
        return response.data;
    },

    // Delete task
    deleteTask: async (id: string) => {
        const response = await api.delete<{ success: boolean; message: string }>(`/tasks/${id}`);
        return response.data;
    },

    // Update task status
    updateTaskStatus: async (id: string, status: Task['status']) => {
        const response = await api.patch<SingleTaskResponse>(`/tasks/${id}/status`, { status });
        return response.data;
    },

    // Update multiple tasks status
    updateMultipleTasksStatus: async (taskIds: string[], status: Task['status']) => {
        const response = await api.patch('/tasks/multiple/status', { taskIds, status });
        return response.data;
    },

    // Delete multiple tasks
    deleteMultipleTasks: async (taskIds: string[]) => {
        const response = await api.delete('/tasks/multiple/delete', { data: { taskIds } });
        return response.data;
    },
};
