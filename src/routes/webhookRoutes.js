/**
 * Rota de Webhook do Asaas
 * Endpoint público para receber notificações do Asaas
 */

import express from 'express';
import { paymentController } from '../controllers/paymentController.js';

const router = express.Router();

// Webhook do Asaas (SEM autenticação - validação por signature)
router.post('/asaas', (req, res) => paymentController.handleWebhook(req, res));

export default router;
