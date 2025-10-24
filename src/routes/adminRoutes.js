import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication, admin role, and rate limiting
router.use(authenticateToken, isAdmin);
router.use(adminLimiter);

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/stats', adminController.getStats);

export default router;
