import express from 'express';
import {
  getAll,
  getOne,
  update,
  changePassword,
  remove,
} from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireAdmin, getAll);
router.get('/:id', getOne);
router.put('/profile', update);
router.put('/password', changePassword);
router.delete('/profile', remove);

export default router;
