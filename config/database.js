const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MONGODB_URI is not defined in .env file');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB: ${mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✓ MongoDB Connected Successfully`);
    console.log(`  Host: ${conn.connection.host}`);
    console.log(`  Database: ${conn.connection.name}`);
    console.log(`  Port: ${conn.connection.port}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    console.error('Please check:');
    console.error('  1. MongoDB server is running');
    console.error('  2. Connection string is correct in .env file');
    console.error('  3. Database name and port are correct');
    process.exit(1);
  }
};

module.exports = connectDB;
