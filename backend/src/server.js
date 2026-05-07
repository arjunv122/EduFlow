require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initEmailTransporter } = require('./utils/email.util');
// Note: socket.io integration will go here in Phase 2

const PORT = process.env.PORT || 8000;

// Connect to MongoDB, init Email, and start server
const startServer = async () => {
  try {
    await connectDB();
    await initEmailTransporter();
    
    const server = http.createServer(app);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
