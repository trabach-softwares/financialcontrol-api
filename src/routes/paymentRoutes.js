/**
 * Rotas de Pagamentos
 * Integração com Asaas (PIX, Boleto, Cartão)
 */

import express from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas (exceto webhook) requerem autenticação
router.post('/', authenticateToken, (req, res) => paymentController.createPayment(req, res));
router.get('/', authenticateToken, (req, res) => paymentController.listPayments(req, res));
router.get('/:paymentId', authenticateToken, (req, res) => paymentController.getPaymentStatus(req, res));
router.get('/:paymentId/pix', authenticateToken, (req, res) => paymentController.getPixQrCode(req, res));
router.delete('/:paymentId', authenticateToken, (req, res) => paymentController.cancelPayment(req, res));

export default router;
