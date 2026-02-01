import axios from 'axios';

// API Base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
// WHY: Centralized config, auto JWT attachment
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 seconds
});

// Request interceptor: Auto-attach JWT token
// WHY: Không cần manually thêm token vào mỗi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle errors globally
// WHY: Centralized error handling, auto logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ===================================================================
// AUTH API
// ===================================================================

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface User {
    _id: string;
    username: string;
    email: string;
    role: 'admin' | 'member';
    avatar?: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    data: {
        user: User;
        token: string;
    };
}

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);

    // Save token and user to localStorage
    // WHY: Persist authentication across page reloads
    if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);

    if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
};

/**
 * Logout user
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

// ===================================================================
// PROJECTS API
// ===================================================================

export const getProjects = async () => {
    const response = await api.get('/projects');
    return response.data;
};

export const getProjectById = async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
};

export const createProject = async (data: { name: string; description?: string }) => {
    const response = await api.post('/projects', data);
    return response.data;
};

// ===================================================================
// TASKS API
// ===================================================================

export const getTasks = async (filters?: {
    project?: string;
    status?: string;
    assignee?: string;
}) => {
    const response = await api.get('/tasks', { params: filters });
    return response.data;
};

export const createTask = async (data: any) => {
    const response = await api.post('/tasks', data);
    return response.data;
};

export const updateTaskStatus = async (taskId: string, status: string) => {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
};

export const getTaskById = async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
};

export const updateTask = async (taskId: string, data: any) => {
    const response = await api.patch(`/tasks/${taskId}`, data);
    return response.data;
};

export const reorderTask = async (taskId: string, newStatus: string, newPosition: number) => {
    const response = await api.patch(`/tasks/${taskId}/reorder`, { newStatus, newPosition });
    return response.data;
};

// ===================================================================
// CHECKLIST API
// ===================================================================

export const addChecklistItem = async (taskId: string, title: string) => {
    const response = await api.post(`/tasks/${taskId}/checklist`, { title });
    return response.data;
};

export const toggleChecklistItem = async (taskId: string, index: number) => {
    const response = await api.patch(`/tasks/${taskId}/checklist/${index}/toggle`);
    return response.data;
};

export const updateChecklistItem = async (taskId: string, index: number, title: string) => {
    const response = await api.patch(`/tasks/${taskId}/checklist/${index}`, { title });
    return response.data;
};

export const deleteChecklistItem = async (taskId: string, index: number) => {
    const response = await api.delete(`/tasks/${taskId}/checklist/${index}`);
    return response.data;
};

export default api;
