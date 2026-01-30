// Task interface matching MongoDB model
export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

// API Response types
export interface TasksResponse {
    success: boolean;
    data: Task[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SingleTaskResponse {
    success: boolean;
    data: Task;
}

export interface ApiError {
    success: false;
    message: string;
}

// Form data for create/update
export interface TaskFormData {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
}
