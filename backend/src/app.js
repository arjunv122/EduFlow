const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes/server');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// Security and basic middlewares
app.use(helmet());
  app.use(cors({ origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global API Routes prefixed
app.use('/api', apiRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
