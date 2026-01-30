# TaskFlow - Task Management System

A modern task management application with a Jira-like UI, built with MongoDB, Express, and vanilla JavaScript.

## 📁 Project Structure

```
taskflow-API-2/
├── actions/              # Backend API (Express + MongoDB)
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── server.js        # Express server
│   └── package.json
│
├── client/              # Frontend (HTML, CSS, JS)
│   ├── public/
│   │   ├── css/        # Stylesheets
│   │   ├── js/         # JavaScript files
│   │   └── index.html  # Main HTML file
│   └── package.json
│
├── .env                 # Environment variables
├── package.json         # Root package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote)

### Installation

1. **Install backend dependencies:**
   ```bash
   cd actions
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd client
   npm install
   ```

### Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
```

### Running the Application

#### Option 1: Run Backend and Frontend Separately

**Terminal 1 - Backend:**
```bash
npm run server
```
Backend will run on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm run client
```
Frontend will run on http://localhost:3000

#### Option 2: Run Backend Only (serves static files)
```bash
npm run dev
```
Access at http://localhost:5000

## 📡 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks (with filtering, sorting, pagination)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `DELETE /api/tasks/multiple/delete` - Delete multiple tasks
- `PATCH /api/tasks/:id/status` - Update task status
- `PATCH /api/tasks/multiple/status` - Update multiple tasks status

## 🎨 Features

- **Kanban Board** - Drag and drop tasks between columns
- **Task Management** - Create, edit, delete, and update tasks
- **Priority Levels** - Low, Medium, High
- **Status Tracking** - Pending, In Progress, Completed, Cancelled
- **Search & Filter** - Find tasks quickly
- **Responsive Design** - Works on all devices
- **Premium UI** - Modern, beautiful interface with animations

## 🛠️ Tech Stack

**Backend:**
- Express.js
- MongoDB + Mongoose
- CORS
- dotenv

**Frontend:**
- HTML5
- CSS3 (with animations)
- Vanilla JavaScript
- Fetch API

## 📝 License

ISC
