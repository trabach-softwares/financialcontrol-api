/**
 * Public Plan Controller
 * Controller para endpoints públicos de planos (sem autenticação)
 * Usado pela Landing Page para exibir planos disponíveis
 */

import { planService } from '../services/planService.js';
import { sendSuccess, sendError } from '../utils/response.js';

class PublicPlanController {
  /**
   * GET /api/public/plans
   * Lista todos os planos visíveis (is_active = true)
   * Endpoint PÚBLICO - não requer autenticação
   */
  async getVisiblePlans(req, res) {
    try {
      console.log('📋 [PUBLIC] Buscando planos visíveis para Landing Page');

      const plans = await planService.getVisiblePlans();

      // Formatar resposta para a Landing Page
      const formattedPlans = plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        features: plan.features || [],
        maxTransactions: plan.max_transactions,
        recommended: plan.recommended || false,
        popular: plan.popular || false
      }));

      console.log(`✅ [PUBLIC] ${formattedPlans.length} plano(s) encontrado(s)`);

      return sendSuccess(res, {
        plans: formattedPlans,
        total: formattedPlans.length
      }, 'Planos recuperados com sucesso');

    } catch (error) {
      console.error('❌ [PUBLIC] Erro ao buscar planos:', error);
      return sendError(res, 'Erro ao recuperar planos', 500);
    }
  }

  /**
   * GET /api/public/plans/:id
   * Busca um plano específico por ID
   * Endpoint PÚBLICO - não requer autenticação
   */
  async getPlanById(req, res) {
    try {
      const { id } = req.params;

      console.log(`📋 [PUBLIC] Buscando plano ${id} para Landing Page`);

      const plan = await planService.getById(id);

      if (!plan) {
        console.log(`⚠️  [PUBLIC] Plano ${id} não encontrado`);
        return sendError(res, 'Plano não encontrado', 404);
      }

      // Verificar se o plano está ativo
      if (!plan.is_active) {
        console.log(`⚠️  [PUBLIC] Plano ${id} não está ativo`);
        return sendError(res, 'Plano não disponível', 404);
      }

      // Formatar resposta
      const formattedPlan = {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        features: plan.features || [],
        maxTransactions: plan.max_transactions,
        recommended: plan.recommended || false,
        popular: plan.popular || false
      };

      console.log(`✅ [PUBLIC] Plano ${id} encontrado: ${plan.name}`);

      return sendSuccess(res, formattedPlan, 'Plano recuperado com sucesso');

    } catch (error) {
      console.error('❌ [PUBLIC] Erro ao buscar plano:', error);
      return sendError(res, 'Erro ao recuperar plano', 500);
    }
  }
}

export const publicPlanController = new PublicPlanController();
