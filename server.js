const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const taskRoutes = require('./routes/taskRoutes');

dotenv.config();

connectDB();

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Task Management API',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
