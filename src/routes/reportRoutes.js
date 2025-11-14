import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * GET /api/reports/summary
 * Retorna relatório resumido
 * Query params:
 *   - startDate (opcional): YYYY-MM-DD
 *   - endDate (opcional): YYYY-MM-DD
 * 
 * Regras:
 *   - FREE: vê apenas TOP 3 categorias
 *   - PRO/PREMIUM: vê todas as categorias
 */
router.get('/summary', apiLimiter, reportController.getSummary);

/**
 * POST /api/reports/export
 * Exporta relatório completo em PDF/Excel/CSV
 * Body:
 *   - format: 'pdf' | 'xlsx' | 'csv' (default: 'pdf')
 *   - startDate (opcional): YYYY-MM-DD
 *   - endDate (opcional): YYYY-MM-DD
 * 
 * Regras:
 *   - FREE: bloqueado (retorna 403)
 *   - PRO: máximo 5 exportações por dia
 *   - PREMIUM: ilimitado
 */
router.post('/export', apiLimiter, reportController.export);

export default router;
