/**
 * Controller de Pagamentos
 * Endpoints para processar pagamentos via Asaas (PIX, Boleto, Cartão)
 */

import { paymentService } from '../services/paymentService.js';
import { sendSuccess, sendError } from '../utils/response.js';

class PaymentController {
  /**
   * POST /api/payments
   * Criar novo pagamento
   */
  async createPayment(req, res) {
    try {
      const { planId, paymentMethod, creditCard } = req.body;
      const userId = req.user.id;

      // Validações
      if (!planId) {
        return sendError(res, 'ID do plano é obrigatório', 400);
      }

      if (!paymentMethod) {
        return sendError(res, 'Método de pagamento é obrigatório', 400);
      }

      const validMethods = ['PIX', 'BOLETO', 'CREDIT_CARD'];
      if (!validMethods.includes(paymentMethod)) {
        return sendError(
          res,
          `Método de pagamento inválido. Use: ${validMethods.join(', ')}`,
          400
        );
      }

      // Se cartão, validar dados
      if (paymentMethod === 'CREDIT_CARD') {
        if (!creditCard) {
          return sendError(res, 'Dados do cartão são obrigatórios', 400);
        }

        const requiredFields = ['number', 'holderName', 'expiryDate', 'cvv'];
        const missingFields = requiredFields.filter(field => !creditCard[field]);

        if (missingFields.length > 0) {
          return sendError(
            res,
            `Campos obrigatórios do cartão: ${missingFields.join(', ')}`,
            400
          );
        }

        // Validar formato da data de expiração (MM/YYYY)
        if (!/^\d{2}\/\d{4}$/.test(creditCard.expiryDate)) {
          sendError(
            res,
            'Data de expiração inválida. Use o formato: MM/YYYY',
            400
          );
        }

        // Validar CVV (3 ou 4 dígitos)
        if (!/^\d{3,4}$/.test(creditCard.cvv)) {
          return sendError(res, 'CVV inválido (3 ou 4 dígitos)', 400);
        }
      }

      // Criar pagamento
      const result = await paymentService.createPayment(
        userId,
        planId,
        paymentMethod,
        creditCard
      );

      return sendSuccess(res, result, 'Pagamento criado com sucesso', 201);

    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      return sendError(res, error.message, 400);
    }
  }

  /**
   * GET /api/payments/:paymentId
   * Consultar status do pagamento
   */
  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      if (!paymentId) {
        return sendError(res, 'ID do pagamento é obrigatório', 400);
      }

      const payment = await paymentService.getPaymentStatus(paymentId, userId);

      return sendSuccess(res, { payment });

    } catch (error) {
      console.error('❌ Erro ao consultar pagamento:', error);
      
      if (error.message === 'Pagamento não encontrado') {
        return sendError(res, error.message, 404);
      }
      
      return sendError(res, error.message, 400);
    }
  }

  /**
   * GET /api/payments/:paymentId/pix
   * Obter QR Code PIX do pagamento
   */
  async getPixQrCode(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      if (!paymentId) {
        return sendError(res, 'ID do pagamento é obrigatório', 400);
      }

      // Verificar se o pagamento pertence ao usuário
      const payment = await paymentService.getPaymentStatus(paymentId, userId);

      if (payment.payment_method !== 'PIX') {
        return sendError(res, 'Este pagamento não é via PIX', 400);
      }

      if (!payment.pix_payload || !payment.pix_qr_code_image) {
        // Buscar dados atualizados do PIX
        const pixData = await paymentService.getPixQrCode(paymentId);
        
        return sendSuccess(res, pixData);
      }

      // Retornar dados salvos
      return sendSuccess(res, {
        qrCodeImage: payment.pix_qr_code_image,
        payload: payment.pix_payload,
        expiresAt: payment.pix_expires_at
      });

    } catch (error) {
      console.error('❌ Erro ao buscar QR Code PIX:', error);
      
      if (error.message === 'Pagamento não encontrado') {
        return sendError(res, error.message, 404);
      }
      
      return sendError(res, error.message, 400);
    }
  }

  /**
   * GET /api/payments
   * Listar pagamentos do usuário
   */
  async listPayments(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit, offset } = req.query;

      // Validar status se fornecido
      if (status) {
        const validStatuses = [
          'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 
          'CANCELLED', 'REFUNDED'
        ];
        
        if (!validStatuses.includes(status)) {
          return sendError(
            res,
            `Status inválido. Use: ${validStatuses.join(', ')}`,
            400
          );
        }
      }

      // Validar limit e offset
      if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return sendError(res, 'Limit deve ser entre 1 e 100', 400);
      }

      if (offset && (isNaN(offset) || offset < 0)) {
        return sendError(res, 'Offset deve ser maior ou igual a 0', 400);
      }

      const payments = await paymentService.listPayments(userId, {
        status,
        limit: limit || 20,
        offset: offset || 0
      });

      return sendSuccess(res, payments);

    } catch (error) {
      console.error('❌ Erro ao listar pagamentos:', error);
      return sendError(res, error.message, 400);
    }
  }

  /**
   * DELETE /api/payments/:paymentId
   * Cancelar pagamento pendente
   */
  async cancelPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      if (!paymentId) {
        return sendError(res, 'ID do pagamento é obrigatório', 400);
      }

      await paymentService.cancelPayment(paymentId, userId);

      return sendSuccess(res, null, 'Pagamento cancelado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento:', error);
      
      if (error.message === 'Pagamento não encontrado') {
        return sendError(res, error.message, 404);
      }
      
      if (error.message === 'Apenas pagamentos pendentes podem ser cancelados') {
        return sendError(res, error.message, 400);
      }
      
      return sendError(res, error.message, 400);
    }
  }

  /**
   * POST /api/webhooks/asaas
   * Receber notificações do Asaas
   */
  async handleWebhook(req, res) {
    try {
      // Validar assinatura
      const signature = 
        req.headers['asaas-access-token'] || 
        req.headers['x-asaas-signature'];

      if (!paymentService.validateWebhookSignature(req.body, signature)) {
        console.error('❌ Webhook signature inválida');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { event, payment } = req.body;

      if (!event || !payment) {
        console.error('❌ Webhook com dados inválidos');
        return res.status(400).json({ error: 'Invalid payload' });
      }

      console.log(`🔔 Webhook recebido: ${event} - Payment: ${payment.id}`);

      // Processar webhook de forma assíncrona
      paymentService.processWebhook(event, payment)
        .then(success => {
          if (success) {
            console.log(`✅ Webhook processado: ${event}`);
          } else {
            console.error(`❌ Falha ao processar webhook: ${event}`);
          }
        })
        .catch(error => {
          console.error('❌ Erro ao processar webhook:', error);
        });

      // Retornar 200 imediatamente (Asaas espera resposta rápida)
      return res.status(200).json({ received: true });

    } catch (error) {
      console.error('❌ Erro no webhook:', error);
      return res.status(500).json({ error: 'Internal error' });
    }
  }
}

export const paymentController = new PaymentController();
