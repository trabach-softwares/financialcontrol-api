import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticateToken, authController.me);
router.post('/refresh', authenticateToken, authController.refresh);
router.post('/logout', authenticateToken, authController.logout);

// Development-only utilities
if (process.env.NODE_ENV === 'development') {
  router.post('/dev-reset-password', authController.devResetPassword);
}

export default router;
