import express from 'express';
import { planController } from '../controllers/planController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', planController.getAll);
router.get('/:id', planController.getById);

// Admin only routes
router.post('/', authenticateToken, isAdmin, planController.create);
router.put('/:id', authenticateToken, isAdmin, planController.update);
router.delete('/:id', authenticateToken, isAdmin, planController.delete);

export default router;
