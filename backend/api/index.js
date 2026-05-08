const mongoose = require('mongoose');

let isConnected = false;
let app;

const getApp = () => {
  if (!app) {
    app = require('../src/app');
  }
  return app;
};

module.exports = async (req, res) => {
  try {
    if (!isConnected) {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        return res.status(500).json({ success: false, message: 'MONGODB_URI not configured' });
      }
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      isConnected = true;
    }
    return getApp()(req, res);
  } catch (err) {
    console.error('Serverless handler error:', err.message);
    isConnected = false;
    return res.status(500).json({ success: false, message: 'Server initialization failed: ' + err.message });
  }
};
