import express from 'express';
import {
  create,
  getAll,
  getOne,
  update,
  remove,
  getSummary,
} from '../controllers/transactionController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', create);
router.get('/', getAll);
router.get('/summary', getSummary);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
