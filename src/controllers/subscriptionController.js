/**
 * Subscription Controller - Controlador de Assinaturas Recorrentes
 * Gerencia requisições HTTP para assinaturas trimestral e anual
 * 
 * @module controllers/subscriptionController
 */

import { subscriptionService } from '../services/subscriptionService.js';
import { supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Controlador de Assinaturas
 * Implementa CRUD de assinaturas recorrentes com cartão de crédito
 */
export const subscriptionController = {
  
  /**
   * Criar nova assinatura trimestral ou anual
   * 
   * POST /api/subscriptions
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
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { planId, cycle, creditCardData } = req.body;

      // ========================================
      // Validações de entrada
      // ========================================

      if (!planId) {
        return sendError(res, 'ID do plano é obrigatório', 400);
      }

      if (!cycle) {
        return sendError(res, 'Ciclo de assinatura é obrigatório', 400);
      }

      // Validar ciclos permitidos
      const allowedCycles = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
      if (!allowedCycles.includes(cycle)) {
        return sendError(
          res, 
          `Ciclo inválido. Use: ${allowedCycles.join(', ')}`, 
          400
        );
      }

      if (!creditCardData) {
        return sendError(res, 'Dados do cartão são obrigatórios', 400);
      }

      // Validar campos obrigatórios do cartão
      const requiredCardFields = [
        'holderName', 
        'number', 
        'expiryMonth', 
        'expiryYear', 
        'cvv'
      ];

      for (const field of requiredCardFields) {
        if (!creditCardData[field]) {
          return sendError(
            res, 
            `Campo "${field}" do cartão é obrigatório`, 
            400
          );
        }
      }

      // Validar formato do cartão
      const cardNumber = String(creditCardData.number).replace(/[\s-]/g, '');
      if (!/^\d+$/.test(cardNumber)) {
        return sendError(res, 'Número do cartão inválido (apenas dígitos)', 400);
      }
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        return sendError(
          res, 
          'Número do cartão inválido (deve ter entre 13 e 19 dígitos)', 
          400
        );
      }

      // Validar CVV
      const cvvStr = String(creditCardData.cvv);
      if (!/^\d{3,4}$/.test(cvvStr)) {
        return sendError(
          res, 
          'CVV inválido (deve ter 3 ou 4 dígitos numéricos)', 
          400
        );
      }

      // Validar mês de validade
      const expiryMonth = parseInt(creditCardData.expiryMonth, 10);
      if (isNaN(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) {
        return sendError(
          res, 
          'Mês de validade inválido (01-12)', 
          400
        );
      }

      // Validar ano + mês combinados (cartão não pode estar expirado)
      const now = new Date();
      const currentYear  = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      let expiryYear = parseInt(creditCardData.expiryYear, 10);
      // normalizar ano de 2 dígitos (ex: "26" → 2026)
      if (expiryYear < 100) expiryYear += 2000;
      if (
        isNaN(expiryYear) ||
        expiryYear < currentYear ||
        (expiryYear === currentYear && expiryMonth < currentMonth)
      ) {
        return sendError(res, 'Cartão expirado', 400);
      }

      // Validar se já possui assinatura ativa
      const activeSubscription = await subscriptionService.getActiveSubscription(userId);
      if (activeSubscription) {
        return sendError(
          res,
          'Você já possui uma assinatura ativa. Cancele-a antes de criar uma nova.',
          400
        );
      }

      console.log(`[subscriptionController.create] Criando assinatura ${cycle} para usuário ${userId}`);

      // ========================================
      // Criar assinatura
      // ========================================

      const subscription = await subscriptionService.createSubscription(
        userId,
        planId,
        cycle,
        creditCardData
      );

      console.log(`[subscriptionController.create] ✅ Assinatura criada: ${subscription.subscription.id}`);

      return sendSuccess(
        res, 
        subscription, 
        'Assinatura criada com sucesso', 
        201
      );

    } catch (error) {
      console.error('[subscriptionController.create] Erro:', error);
      const statusCode = error.status || 400;
      return sendError(
        res, 
        error.message || 'Erro ao criar assinatura', 
        statusCode, 
        error.data
      );
    }
  },

  /**
   * Buscar assinatura ativa do usuário
   * 
   * GET /api/subscriptions/active
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async getActive(req, res) {
    try {
      const userId = req.user.id;

      console.log(`[subscriptionController.getActive] Buscando assinatura ativa para usuário ${userId}`);

      const subscription = await subscriptionService.getActiveSubscription(userId);

      if (!subscription) {
        return sendSuccess(
          res, 
          null, 
          'Nenhuma assinatura ativa encontrada'
        );
      }

      console.log(`[subscriptionController.getActive] ✅ Assinatura encontrada: ${subscription.id}`);

      return sendSuccess(
        res, 
        subscription, 
        'Assinatura encontrada'
      );

    } catch (error) {
      console.error('[subscriptionController.getActive] Erro:', error);
      return sendError(
        res, 
        error.message || 'Erro ao buscar assinatura', 
        400
      );
    }
  },

  /**
   * Listar todas as assinaturas do usuário (histórico)
   * 
   * GET /api/subscriptions
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async list(req, res) {
    try {
      const userId = req.user.id;

      console.log(`[subscriptionController.list] Listando assinaturas do usuário ${userId}`);

      const { data: subscriptions, error } = await subscriptionService.supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          plans (
            id,
            name,
            description,
            price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[subscriptionController.list] Erro ao buscar assinaturas:', error);
        throw new Error('Erro ao buscar assinaturas');
      }

      // Enriquecer dados
      const enrichedSubscriptions = subscriptions.map(sub => ({
        ...sub,
        cycleLabel: subscriptionService._getCycleLabel(sub.cycle)
      }));

      console.log(`[subscriptionController.list] ✅ ${subscriptions.length} assinatura(s) encontrada(s)`);

      return sendSuccess(
        res,
        enrichedSubscriptions,
        `${subscriptions.length} assinatura(s) encontrada(s)`
      );

    } catch (error) {
      console.error('[subscriptionController.list] Erro:', error);
      return sendError(
        res,
        error.message || 'Erro ao listar assinaturas',
        400
      );
    }
  },

  /**
   * Cancelar assinatura
   * 
   * DELETE /api/subscriptions/:id
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async cancel(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validações
      if (!id) {
        return sendError(res, 'ID da assinatura é obrigatório', 400);
      }

      console.log(`[subscriptionController.cancel] Cancelando assinatura ${id} do usuário ${userId}`);

      const result = await subscriptionService.cancelSubscription(userId, id);

      console.log(`[subscriptionController.cancel] ✅ Assinatura cancelada: ${id}`);

      return sendSuccess(
        res, 
        result, 
        'Assinatura cancelada com sucesso'
      );

    } catch (error) {
      console.error('[subscriptionController.cancel] Erro:', error);
      return sendError(
        res, 
        error.message || 'Erro ao cancelar assinatura', 
        400
      );
    }
  },

  /**
   * Atualizar cartão da assinatura
   * 
   * PUT /api/subscriptions/:id/card
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
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async updateCard(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { creditCardData } = req.body;

      // ========================================
      // Validações
      // ========================================

      if (!id) {
        return sendError(res, 'ID da assinatura é obrigatório', 400);
      }

      if (!creditCardData) {
        return sendError(res, 'Dados do novo cartão são obrigatórios', 400);
      }

      // Validar campos obrigatórios do cartão
      const requiredCardFields = [
        'holderName', 
        'number', 
        'expiryMonth', 
        'expiryYear', 
        'cvv'
      ];

      for (const field of requiredCardFields) {
        if (!creditCardData[field]) {
          return sendError(
            res, 
            `Campo "${field}" do cartão é obrigatório`, 
            400
          );
        }
      }

      // Validar formato do cartão
      const cardNumber = creditCardData.number.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        return sendError(
          res, 
          'Número do cartão inválido (deve ter entre 13 e 19 dígitos)', 
          400
        );
      }

      // Validar CVV
      if (creditCardData.cvv.length < 3 || creditCardData.cvv.length > 4) {
        return sendError(
          res, 
          'CVV inválido (deve ter 3 ou 4 dígitos)', 
          400
        );
      }

      console.log(`[subscriptionController.updateCard] Atualizando cartão da assinatura ${id}`);

      const result = await subscriptionService.updateSubscriptionCard(
        userId,
        id,
        creditCardData
      );

      console.log(`[subscriptionController.updateCard] ✅ Cartão atualizado: ${id}`);

      return sendSuccess(
        res, 
        result, 
        'Cartão atualizado com sucesso'
      );

    } catch (error) {
      console.error('[subscriptionController.updateCard] Erro:', error);
      return sendError(
        res, 
        error.message || 'Erro ao atualizar cartão', 
        400
      );
    }
  },

  /**
   * Obter informações de preços e ciclos disponíveis
   * 
   * GET /api/subscriptions/pricing
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async getPricing(req, res) {
    try {
      console.log('[subscriptionController.getPricing] Buscando informações de preços');

      // Buscar todos os planos ativos
      const { data: plans, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('[subscriptionController.getPricing] Erro ao buscar planos:', error);
        throw new Error('Erro ao buscar planos');
      }

      // Calcular preços para cada ciclo
      const pricing = plans.map(plan => {
        const monthlyPrice = parseFloat(plan.price);
        
        return {
          plan: {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            features: plan.features
          },
          cycles: {
            MONTHLY: {
              cycle: 'MONTHLY',
              label: 'Mensal',
              value: monthlyPrice,
              monthlyEquivalent: monthlyPrice,
              discount: 0,
              savings: 0
            },
            QUARTERLY: {
              cycle: 'QUARTERLY',
              label: 'Trimestral',
              value: Math.round(monthlyPrice * 3 * 0.9 * 100) / 100,
              monthlyEquivalent: Math.round(monthlyPrice * 0.9 * 100) / 100,
              discount: 10,
              savings: Math.round(monthlyPrice * 3 * 0.1 * 100) / 100
            },
            YEARLY: {
              cycle: 'YEARLY',
              label: 'Anual',
              value: Math.round(monthlyPrice * 12 * 0.83 * 100) / 100,
              monthlyEquivalent: Math.round(monthlyPrice * 0.83 * 100) / 100,
              discount: 17,
              savings: Math.round(monthlyPrice * 12 * 0.17 * 100) / 100
            }
          }
        };
      });

      console.log(`[subscriptionController.getPricing] ✅ ${plans.length} plano(s) encontrado(s)`);

      return sendSuccess(
        res,
        pricing,
        'Informações de preços carregadas'
      );

    } catch (error) {
      console.error('[subscriptionController.getPricing] Erro:', error);
      return sendError(
        res,
        error.message || 'Erro ao buscar informações de preços',
        400
      );
    }
  }
};
