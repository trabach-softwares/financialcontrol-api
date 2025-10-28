import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { sendError } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return sendError(res, 'Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    // Popular tanto req.user quanto req.userId para compatibilidade
    req.user = decoded;
    if (decoded && decoded.id) {
      req.userId = decoded.id;
    }
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 403);
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Admin access required', 403);
  }
  next();
};
