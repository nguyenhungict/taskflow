import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Overview from './pages/Overview';
import ProjectList from './pages/ProjectList';
import ProjectListView from './pages/ProjectListView';
import ProjectBoard from './pages/ProjectBoard';
import ProjectCalendar from './pages/ProjectCalendar';
import DashboardLayout from './layouts/DashboardLayout';
import DirectMessages from './pages/DirectMessages';

/**
 * Protected Route Component
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading Taskflow...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * Main App Component
 */
function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <SocketProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected Routes with Layout */}
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <DashboardLayout />
                                    </ProtectedRoute>
                                }
                            >
                                {/* Main Dashboard (My Work) */}
                                <Route path="/" element={<Overview />} />

                                {/* Projects List */}
                                <Route path="/projects" element={<ProjectList />} />

                                {/* Project Views */}
                                <Route path="/projects/:projectId/board" element={<ProjectBoard />} />
                                <Route path="/projects/:projectId/list" element={<ProjectListView />} />
                                <Route path="/projects/:projectId/calendar" element={<ProjectCalendar />} />

                                {/* Chat / Messages */}
                                <Route path="/messages" element={<DirectMessages />} />

                                {/* Redirects */}
                                <Route path="/tasks" element={<Navigate to="/" replace />} />
                            </Route>

                            {/* Catch all */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </SocketProvider>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
