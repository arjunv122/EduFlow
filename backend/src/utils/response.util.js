const jwt = require('jsonwebtoken');

// Standard success response
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  const payload = { success: true, message };
  
  if (Array.isArray(data)) {
    payload.data = data;
  } else if (data && typeof data === 'object') {
    Object.assign(payload, data);
  } else {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

// Standard error response
const sendError = (res, message = 'Error', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Paginate query
const paginate = async (model, query, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(query)
      .select(options.select || '')
      .populate(options.populate || '')
      .sort(options.sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit),
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get date range for today
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Calculate attendance percentage
const calcAttendancePercent = (present, total) => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100 * 10) / 10; // Round to 1 decimal
};

module.exports = {
  sendSuccess,
  sendError,
  generateToken,
  paginate,
  getTodayRange,
  calcAttendancePercent,
};
