import { verifyToken } from '../config/jwt.js';
import { errorResponse } from '../utils/response.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('No token provided'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json(errorResponse('Invalid or expired token'));
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(errorResponse('Authentication failed'));
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json(errorResponse('Admin access required'));
  }
  next();
};
