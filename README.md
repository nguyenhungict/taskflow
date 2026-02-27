# 🚀 TaskFlow &middot; AI-Powered Task Management System

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

TaskFlow is a next-generation project management platform that combines the power of **Real-time Collaboration** with **Generative AI** to streamline your workflow. It features a modern, intuitive Jira-like interface designed for high-performance teams.

---

## Key Features

### AI Assistant
- **TaskFlow AI**: Integrated assistant powered by **Google Gemini**.
- **Context-Aware**: The AI knows your projects, tasks, and deadlines.
- **Natural Language**: Chat with your tasks to summarize priorities, find overdue items, or suggest next steps.

### Real-time Collaboration
- **Socket.io Integration**: Get instant updates when tasks are moved or updated.
- **Live Notifications**: Never miss an update on your projects.
- **Real-time Chat**: Dedicated chat features for team communication.

### Advanced Project Management
- **Kanban Board**: Modern drag-and-drop board powered by `@hello-pangea/dnd`.
- **Project Workspaces**: Organize tasks into multiple projects with team members.
- **Detailed Analytics**: Dashboard with project stats and task distribution.
- **Rich Task Information**: Priorities, due dates, estimated vs. actual hours, and more.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **Drag & Drop**: @hello-pangea/dnd

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **AI Engine**: Google Generative AI (Gemini 1.5 Flash)
- **Real-time**: Socket.io
- **API Docs**: Swagger (OpenAPI 3.0)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB
- Google Gemini API Key (for AI features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nguyenhungict/taskflow-api.git
   cd taskflow-api
   ```

2. **Setup Backend:**
   ```bash
   cd actions
   npm install
   cp .env.example .env # Update with your MongoDB URI and Gemini API Key
   ```

3. **Setup Client:**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

**Run Backend (API):**
```bash
cd actions
npm run dev
```

**Run Frontend (Client):**
```bash
cd client
npm run dev
```
*App running on http://localhost:5173 (standard Vite port)*

---

## Project Structure

```text
taskflow-API-2/
├── actions/              # Backend API (Express + Node.js)
│   ├── config/          # Database & Swagger configuration
│   ├── controllers/     # AI, Tasks, Projects & Auth logic
│   ├── models/          # MongoDB/Mongoose Schemas
│   ├── routes/          # API Route definitions
│   ├── middleware/      # Auth & Error handling
│   └── server.js        # Main entry point
├── client/              # Frontend (React + TS + Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI elements
│   │   ├── contexts/    # Global state (Auth, Tasks, Toast)
│   │   ├── pages/       # Dashboard, Kanban, Login, etc.
│   │   └── services/    # API calling logic (Axios)
│   └── index.html
└── README.md
```

---

## API Documentation

TaskFlow provides a fully documented RESTful API with Swagger UI.

- **Local Docs**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
- **Main Endpoints**:
  - `POST /api/auth/login` - User Authentication
  - `GET /api/projects` - Manage Projects
  - `GET /api/tasks` - Advanced Task Management
  - `POST /api/ai/chat` - Interact with TaskFlow AI

---

