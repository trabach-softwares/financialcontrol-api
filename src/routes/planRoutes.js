import express from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
  subscribe,
} from '../controllers/planController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAll);
router.get('/:id', getOne);

// Authenticated routes
router.post('/subscribe', authenticate, subscribe);

// Admin routes
router.post('/', authenticate, requireAdmin, create);
router.put('/:id', authenticate, requireAdmin, update);
router.delete('/:id', authenticate, requireAdmin, remove);

export default router;
