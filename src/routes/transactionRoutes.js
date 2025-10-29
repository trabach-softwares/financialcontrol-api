import express from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication and rate limiting
router.use(authenticateToken);
router.use(apiLimiter);

router.post('/', transactionController.create);
router.get('/', transactionController.getAll);
router.get('/stats', transactionController.getStats);
router.get('/timeline', transactionController.getTimeline);
router.patch('/:id/paid', transactionController.markPaid);
// Series (installments)
router.post('/series', transactionController.createBulk);
router.get('/series/:seriesId', transactionController.getSeries);
router.put('/series/:seriesId', transactionController.updateSeries);
router.patch('/series/:seriesId/paid', transactionController.markSeriesPaidForward);
router.delete('/series/:seriesId', transactionController.deleteSeriesForward);
router.get('/:id', transactionController.getById);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.delete);

export default router;
