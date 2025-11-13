import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { checkAccountLimit, checkFeatureAccess } from '../middleware/planLimits.js';
import { accountController, accountValidators } from '../controllers/accountController.js';
import { transactionController, transactionValidators } from '../controllers/transactionController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(apiLimiter);

router.post('/', checkAccountLimit, accountValidators.create, accountController.create);
router.get('/', accountController.list);
router.get('/summary', accountController.getSummary);
router.get(
  '/:accountId/statement',
  transactionValidators.accountStatement,
  transactionController.getAccountStatement
);
router.get(
  '/:accountId/statement/export',
  checkFeatureAccess('pdfExport'),
  transactionValidators.accountStatementExport,
  transactionController.exportAccountStatement
);
router.get('/:id', accountValidators.idParam, accountController.getById);
router.put('/:id', accountValidators.update, accountController.update);
router.patch('/:id/archive', accountValidators.idParam, accountController.archive);
router.delete('/:id', accountValidators.idParam, accountController.delete);

export default router;
