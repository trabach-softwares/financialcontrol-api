import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { sendError } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.debug('[auth] incoming', {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!authHeader,
    bearerPrefix: authHeader?.split(' ')[0]
  })

  if (!token) {
    console.warn('[auth] missing token')
    return sendError(res, 'Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    console.debug('[auth] token decoded', { id: decoded?.id, email: decoded?.email, role: decoded?.role })
    // Popular tanto req.user quanto req.userId para compatibilidade
    req.user = decoded;
    if (decoded && decoded.id) {
      req.userId = decoded.id;
    }
    next();
  } catch (error) {
    console.error('[auth] token verify failed', error?.message)
    return sendError(res, 'Invalid or expired token', 403);
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Admin access required', 403);
  }
  next();
};
