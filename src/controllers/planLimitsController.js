/**
 * Plan Limits Controller
 * Endpoints para consultar limites e status do plano do usuário
 */

import { planLimitsService } from '../services/planLimitsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

class PlanLimitsController {
  /**
   * GET /api/plan-limits
   * Retorna informações completas sobre limites e uso do plano
   */
  async getUserLimits(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`📊 [PLAN_LIMITS] Buscando limites para usuário ${userId}`);
      
      const limitsInfo = await planLimitsService.getUserLimitsInfo(userId);
      
      return sendSuccess(res, limitsInfo, 'Informações de limites obtidas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao buscar limites do usuário:', error);
      return sendError(res, 'Erro ao buscar limites do usuário', 500, error.message);
    }
  }

  /**
   * GET /api/plan-limits/transactions
   * Verifica se pode criar transação e retorna informações
   */
  async checkTransactionLimit(req, res) {
    try {
      const userId = req.user.id;
      
      const check = await planLimitsService.canCreateTransaction(userId);
      
      return sendSuccess(res, check, 'Verificação de limite de transações realizada');
    } catch (error) {
      console.error('❌ Erro ao verificar limite de transações:', error);
      return sendError(res, 'Erro ao verificar limite de transações', 500, error.message);
    }
  }

  /**
   * GET /api/plan-limits/categories
   * Verifica se pode criar categoria e retorna informações
   */
  async checkCategoryLimit(req, res) {
    try {
      const userId = req.user.id;
      
      const check = await planLimitsService.canCreateCategory(userId);
      
      return sendSuccess(res, check, 'Verificação de limite de categorias realizada');
    } catch (error) {
      console.error('❌ Erro ao verificar limite de categorias:', error);
      return sendError(res, 'Erro ao verificar limite de categorias', 500, error.message);
    }
  }

  /**
   * GET /api/plan-limits/accounts
   * Verifica se pode criar conta e retorna informações
   */
  async checkAccountLimit(req, res) {
    try {
      const userId = req.user.id;
      
      const check = await planLimitsService.canCreateAccount(userId);
      
      return sendSuccess(res, check, 'Verificação de limite de contas realizada');
    } catch (error) {
      console.error('❌ Erro ao verificar limite de contas:', error);
      return sendError(res, 'Erro ao verificar limite de contas', 500, error.message);
    }
  }

  /**
   * GET /api/plan-limits/features/:featureName
   * Verifica se pode acessar uma feature específica
   */
  async checkFeatureAccess(req, res) {
    try {
      const userId = req.user.id;
      const { featureName } = req.params;
      
      if (!featureName) {
        return sendError(res, 'Nome da feature é obrigatório', 400);
      }
      
      const check = await planLimitsService.canAccessFeature(userId, featureName);
      
      return sendSuccess(res, check, 'Verificação de acesso à feature realizada');
    } catch (error) {
      console.error('❌ Erro ao verificar acesso à feature:', error);
      return sendError(res, 'Erro ao verificar acesso à feature', 500, error.message);
    }
  }
}

export const planLimitsController = new PlanLimitsController();
