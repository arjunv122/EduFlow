const jwt = require('jsonwebtoken');
const User = require('../modules/identity/models/User');
const { PERMISSIONS } = require('../config/permissions');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get fresh user from DB
    const user = await User.findById(decoded.id).populate('institution');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated.',
      });
    }

    // Check if password changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    next(error);
  }
};

// Role-based access control
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Current role: ${req.user.role}`,
      });
    }
    next();
  };
};

// Ensure user belongs to the same institution
const requireSameInstitution = (req, res, next) => {
  // Superadmin can access everything — but they MUST pass target institution via header
  if (req.user.role === 'superadmin') {
    const headerInstId = req.headers['x-institution-id'];
    if (headerInstId) {
      req.institutionId = headerInstId;
    }
    // even without header, let them through (superadmin sees all)
    return next();
  }

  // For all others, lock to their own institution
  const userInstId = req.user.institution?._id || req.user.institution;
  req.institutionId = userInstId;

  const requestedInstId = req.params.institutionId || req.body?.institution || req.query.institution;
  if (requestedInstId && userInstId) {
    if (userInstId.toString() !== requestedInstId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this institution's data.",
      });
    }
  }
  next();
};

// Check if faculty/admin is approved
const requireApproved = (req, res, next) => {
  if (!req.user.isApproved && req.user.role !== 'superadmin' && req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending approval. Please wait for admin confirmation.',
    });
  }
  next();
};

// Permission-based access control (reads from config/permissions.js)
const requirePermission = (action) => {
  return (req, res, next) => {
    const userPermissions = PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(action)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action (${action}) is not permitted for role: ${req.user.role}`,
      });
    }
    next();
  };
};

module.exports = { protect, requireRole, requireSameInstitution, requireApproved, requirePermission };

