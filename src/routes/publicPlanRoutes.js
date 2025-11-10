/**
 * Public Plan Routes
 * Rotas públicas para planos (sem autenticação)
 * Usado pela Landing Page
 */

import express from 'express';
import { publicPlanController } from '../controllers/publicPlanController.js';

const router = express.Router();

/**
 * GET /api/public/plans
 * Lista todos os planos visíveis (is_active = true)
 * PÚBLICO - Não requer autenticação
 */
router.get('/', publicPlanController.getVisiblePlans.bind(publicPlanController));

/**
 * GET /api/public/plans/:id
 * Busca um plano específico por ID
 * PÚBLICO - Não requer autenticação
 */
router.get('/:id', publicPlanController.getPlanById.bind(publicPlanController));

export default router;
