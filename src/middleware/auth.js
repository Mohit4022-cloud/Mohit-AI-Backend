import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('No authentication token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    socket.userId = decoded.userId;
    socket.organizationId = decoded.organizationId;
    socket.role = decoded.role;

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};