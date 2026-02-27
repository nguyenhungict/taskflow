const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables IMMEDIATELY
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/database');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const socketRoutes = require('./routes/socketRoutes');
const messageRoutes = require('./routes/messageRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const setupSwagger = require('./config/swagger');
const socket = require('./socket');

connectDB();

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
setupSwagger(app);

// Serve static files from client directory
app.use(express.static('../client/public'));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/socket', socketRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Taskflow API - Project Management System',
    version: '1.0.0',
    documentation: 'http://localhost:5000/api-docs'
  });
});

const PORT = process.env.PORT || 5000;

// Need to bind socket.io to the server instances
const server = require('http').createServer(app);
socket.init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
