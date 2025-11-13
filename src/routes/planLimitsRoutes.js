/**
 * Plan Limits Routes
 * Rotas para consultar limites e status do plano
 */

import express from 'express';
import { planLimitsController } from '../controllers/planLimitsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Informações completas de limites
router.get('/', planLimitsController.getUserLimits);

// Verificações específicas
router.get('/transactions', planLimitsController.checkTransactionLimit);
router.get('/categories', planLimitsController.checkCategoryLimit);
router.get('/accounts', planLimitsController.checkAccountLimit);
router.get('/features/:featureName', planLimitsController.checkFeatureAccess);

export default router;
