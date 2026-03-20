/**
 * Subscription Routes - Rotas de Assinaturas Recorrentes
 * Define endpoints HTTP para gerenciamento de assinaturas trimestral e anual
 * 
 * @module routes/subscriptionRoutes
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { subscriptionController } from '../controllers/subscriptionController.js';

const router = express.Router();

// ============================================================================
// Rotas Públicas (sem autenticação)
// ============================================================================

/**
 * GET /api/subscriptions/pricing
 * Obter informações de preços e ciclos disponíveis
 * 
 * Retorna preços calculados para MONTHLY, QUARTERLY e YEARLY
 * com descontos e economia de cada opção
 */
router.get('/pricing', subscriptionController.getPricing);

// ============================================================================
// Rotas Protegidas (requerem autenticação JWT)
// ============================================================================

// Aplicar middleware de autenticação para todas as rotas abaixo
router.use(authenticateToken);

/**
 * POST /api/subscriptions
 * Criar nova assinatura trimestral ou anual
 * 
 * Body:
 * {
 *   "planId": "uuid-do-plano",
 *   "cycle": "QUARTERLY" | "YEARLY",
 *   "creditCardData": {
 *     "holderName": "João Silva",
 *     "number": "5162306219378829",
 *     "expiryMonth": "12",
 *     "expiryYear": "2028",
 *     "cvv": "318"
 *   }
 * }
 * 
 * Response: 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "subscription": { ... },
 *     "plan": { ... },
 *     "message": "Assinatura criada com sucesso!"
 *   }
 * }
 */
router.post('/', subscriptionController.create);

/**
 * GET /api/subscriptions/active
 * Buscar assinatura ativa do usuário autenticado
 * 
 * Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "cycle": "YEARLY",
 *     "value": 499.90,
 *     "nextDueDate": "2027-02-11",
 *     "plans": { ... }
 *   }
 * }
 */
router.get('/active', subscriptionController.getActive);

/**
 * GET /api/subscriptions
 * Listar todas as assinaturas do usuário (histórico)
 * 
 * Response: 200 OK
 * {
 *   "success": true,
 *   "data": [ ... ],
 *   "message": "X assinatura(s) encontrada(s)"
 * }
 */
router.get('/', subscriptionController.list);

/**
 * DELETE /api/subscriptions/:id
 * Cancelar assinatura
 * 
 * Params:
 *   - id: UUID da assinatura local
 * 
 * Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "subscription": {
 *       "id": "uuid",
 *       "status": "CANCELLED",
 *       "cancelledAt": "2026-02-11T...",
 *       "accessUntil": "2026-05-11" // Mantém acesso até próxima renovação
 *     }
 *   },
 *   "message": "Assinatura cancelada com sucesso"
 * }
 */
router.delete('/:id', subscriptionController.cancel);

/**
 * PUT /api/subscriptions/:id/card
 * Atualizar cartão de crédito da assinatura
 * 
 * Params:
 *   - id: UUID da assinatura local
 * 
 * Body:
 * {
 *   "creditCardData": {
 *     "holderName": "João Silva",
 *     "number": "5162306219378829",
 *     "expiryMonth": "12",
 *     "expiryYear": "2028",
 *     "cvv": "318"
 *   }
 * }
 * 
 * Response: 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "card": {
 *       "brand": "MASTERCARD",
 *       "last4": "8829"
 *     }
 *   },
 *   "message": "Cartão atualizado com sucesso"
 * }
 */
router.put('/:id/card', subscriptionController.updateCard);

// ============================================================================
// Exportar Router
// ============================================================================

export default router;
