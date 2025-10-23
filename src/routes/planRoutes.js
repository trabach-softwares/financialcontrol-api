import express from 'express';
import { planController } from '../controllers/planController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { apiLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.get('/', apiLimiter, planController.getAll);
router.get('/:id', apiLimiter, planController.getById);

// Admin only routes with stricter rate limiting
router.post('/', authenticateToken, isAdmin, adminLimiter, planController.create);
router.put('/:id', authenticateToken, isAdmin, adminLimiter, planController.update);
router.delete('/:id', authenticateToken, isAdmin, adminLimiter, planController.delete);

export default router;
