# Task Management API

API quản lý công việc được xây dựng theo mô hình MVC với MongoDB.

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` từ `.env.example` và cấu hình MongoDB:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
```

## Chạy ứng dụng

```bash
npm start
```

Hoặc chạy ở chế độ development:

```bash
npm run dev
```

## API Endpoints

### Lấy danh sách tasks
- **GET** `/api/tasks`
  - Query parameters:
    - `status`: Lọc theo trạng thái (pending, in-progress, completed, cancelled)
    - `sortBy`: Sắp xếp theo (title, status, priority, dueDate, createdAt, updatedAt)
    - `sortOrder`: Thứ tự sắp xếp (asc, desc)
    - `page`: Số trang (mặc định: 1)
    - `limit`: Số lượng mỗi trang (mặc định: 10)
    - `search`: Tìm kiếm theo title hoặc description

### Lấy task theo ID
- **GET** `/api/tasks/:id`

### Tạo task mới
- **POST** `/api/tasks`
  - Body: `{ title, description, status, priority, dueDate }`

### Cập nhật task
- **PUT** `/api/tasks/:id`
  - Body: `{ title, description, status, priority, dueDate }`

### Xóa task
- **DELETE** `/api/tasks/:id`

### Xóa nhiều tasks
- **DELETE** `/api/tasks/multiple/delete`
  - Body: `{ taskIds: ["id1", "id2", ...] }`

### Đổi trạng thái 1 task
- **PATCH** `/api/tasks/:id/status`
  - Body: `{ status: "pending" | "in-progress" | "completed" | "cancelled" }`

### Đổi trạng thái nhiều tasks
- **PATCH** `/api/tasks/multiple/status`
  - Body: `{ taskIds: ["id1", "id2", ...], status: "pending" | "in-progress" | "completed" | "cancelled" }`

## Ví dụ sử dụng

### Lấy danh sách tasks với lọc và phân trang
```
GET /api/tasks?status=completed&sortBy=createdAt&sortOrder=desc&page=1&limit=10
```

### Tìm kiếm tasks
```
GET /api/tasks?search=important
```

### Tạo task mới
```
POST /api/tasks
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the task management API",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2024-12-31"
}
```

### Đổi trạng thái nhiều tasks
```
PATCH /api/tasks/multiple/status
Content-Type: application/json

{
  "taskIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "status": "completed"
}
```
