import express from 'express';
import {
  getUsers,
  updateRole,
  deleteUser,
  getStats,
  getTransactions,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', getUsers);
router.put('/users/:id/role', updateRole);
router.delete('/users/:id', deleteUser);
router.get('/stats', getStats);
router.get('/transactions', getTransactions);

export default router;
