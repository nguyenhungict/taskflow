# TaskFlow Client - Cấu trúc thư mục

## 📁 Cấu trúc được tối ưu hóa

```
client/src/
├── components/          # React components
│   ├── Header.tsx              # Navigation bar, search
│   ├── KanbanBoard.tsx         # Main Kanban board
│   ├── KanbanColumn.tsx        # Single column (To Do, In Progress, etc.)
│   ├── TaskCard.tsx            # Individual task card
│   ├── TaskModal.tsx           # Create/Edit task modal
│   └── DeleteConfirmModal.tsx  # Delete confirmation dialog
│
├── services/            # API services
│   └── api.ts                  # ✅ Centralized API calls
│
├── types/               # TypeScript type definitions
│   └── task.ts                 # ✅ Task interfaces & types
│
├── styles/              # CSS files
│   ├── index.css               # ✅ Global styles
│   └── App.css                 # ✅ App styles
│
├── utils/               # Utility functions & constants
│   └── constants.ts            # ✅ Status/Priority constants & colors
│
├── hooks/               # Custom React hooks (optional)
│   └── useTasks.ts             # Custom hook for task management
│
├── App.tsx              # ✅ Main App component
├── main.tsx             # ✅ Entry point
└── vite-env.d.ts        # TypeScript declarations
```

## 📦 Files đã tạo

### ✅ `types/task.ts`
- Interface `Task` - Task model structure
- Type `TaskStatus` - Status types
- Type `TaskPriority` - Priority levels
- API response types

### ✅ `services/api.ts`
- `taskAPI.getAllTasks()` - Get all tasks with filters
- `taskAPI.getTaskById()` - Get single task
- `taskAPI.createTask()` - Create new task
- `taskAPI.updateTask()` - Update task
- `taskAPI.deleteTask()` - Delete task
- `taskAPI.updateTaskStatus()` - Update status (for drag-drop)
- `taskAPI.updateMultipleTasksStatus()` - Bulk update
- `taskAPI.deleteMultipleTasks()` - Bulk delete

### ✅ `utils/constants.ts`
- `TASK_STATUSES` - Array of statuses
- `STATUS_LABELS` - Display names
- `STATUS_COLORS` - Color codes for UI
- `PRIORITY_LEVELS` - Priority array
- `PRIORITY_COLORS` - Priority colors
- `PRIORITY_LABELS` - Priority display names

## 🎯 Cách sử dụng

### Import types:
```typescript
import type { Task, TaskStatus, TaskPriority } from './types/task';
```

### Import API service:
```typescript
import { taskAPI } from './services/api';

// Fetch all tasks
const response = await taskAPI.getAllTasks();
console.log(response.data); // Array of tasks
```

### Import constants:
```typescript
import { STATUS_LABELS, PRIORITY_COLORS } from './utils/constants';

// Use in components
<span style={{ color: PRIORITY_COLORS[task.priority] }}>
  {task.priority}
</span>
```

## 🚀 Bước tiếp theo

Bây giờ bạn có thể tạo các components trong folder `components/`:

1. **TaskCard.tsx** - Card hiển thị task
2. **KanbanColumn.tsx** - Column chứa các task cards
3. **KanbanBoard.tsx** - Board chính với drag-drop
4. **TaskModal.tsx** - Modal tạo/sửa task
5. **Header.tsx** - Top navigation với search

Tất cả đã được tổ chức gọn gàng và dễ quản lý! 🎉
