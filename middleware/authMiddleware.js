import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Read the JWT from the cookie or authorization header
  token = req.cookies.jwt || 
          (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
            ? req.headers.authorization.split(' ')[1] 
            : null);

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    req.user = await User.findById(decoded.userId).select('-password');
    
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    // Check if account is active
    if (req.user.status !== 'active') {
      res.status(403);
      throw new Error(`Account is ${req.user.status}`);
    }

    next();
  } catch (error) {
    console.error('JWT Error:', error.message);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Role-based access control
const role = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Not authorized, requires ${roles.join(' or ')} role`);
    }
    next();
  };
};

export { protect, admin, role };