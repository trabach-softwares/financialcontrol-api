/**
 * Middleware de Validação de Limites do Plano
 * Verifica se o usuário pode realizar determinadas ações baseado no seu plano
 */

import { planLimitsService } from '../services/planLimitsService.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware para verificar limite de transações
 */
export const checkTransactionLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const check = await planLimitsService.canCreateTransaction(userId);

    if (!check.allowed) {
      console.log(`🚫 [PLAN_LIMIT] Usuário ${userId} atingiu limite de transações (${check.current}/${check.limit}) - Plano: ${check.planName}`);
      
      return sendError(res, 'Limite de transações atingido', 403, {
        current: check.current,
        limit: check.limit,
        planName: check.planName,
        message: `Você atingiu o limite de ${check.limit} transações/mês do plano ${check.planName}. Faça upgrade para criar mais transações.`,
        upgradeRequired: true
      });
    }

    console.log(`✅ [PLAN_LIMIT] Transação permitida para usuário ${userId} (${check.current}/${check.limit}) - Plano: ${check.planName}`);
    
    // Adiciona informações ao request para uso posterior
    req.planLimitInfo = check;
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar limite de transações:', error);
    return sendError(res, 'Erro ao verificar limite de transações', 500, error.message);
  }
};

/**
 * Middleware para verificar limite de categorias
 */
export const checkCategoryLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const check = await planLimitsService.canCreateCategory(userId);

    if (!check.allowed) {
      console.log(`🚫 [PLAN_LIMIT] Usuário ${userId} atingiu limite de categorias (${check.current}/${check.limit}) - Plano: ${check.planName}`);
      
      return sendError(res, 'Limite de categorias atingido', 403, {
        current: check.current,
        limit: check.limit,
        planName: check.planName,
        message: `Você atingiu o limite de ${check.limit} categorias personalizadas do plano ${check.planName}. Faça upgrade para criar mais categorias.`,
        upgradeRequired: true
      });
    }

    console.log(`✅ [PLAN_LIMIT] Categoria permitida para usuário ${userId} (${check.current}/${check.limit}) - Plano: ${check.planName}`);
    
    req.planLimitInfo = check;
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar limite de categorias:', error);
    return sendError(res, 'Erro ao verificar limite de categorias', 500, error.message);
  }
};

/**
 * Middleware para verificar limite de contas
 */
export const checkAccountLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const check = await planLimitsService.canCreateAccount(userId);

    if (!check.allowed) {
      console.log(`🚫 [PLAN_LIMIT] Usuário ${userId} atingiu limite de contas (${check.current}/${check.limit}) - Plano: ${check.planName}`);
      
      return sendError(res, 'Limite de contas atingido', 403, {
        current: check.current,
        limit: check.limit,
        planName: check.planName,
        message: `Você atingiu o limite de ${check.limit} conta(s) do plano ${check.planName}. Faça upgrade para criar mais contas.`,
        upgradeRequired: true
      });
    }

    console.log(`✅ [PLAN_LIMIT] Conta permitida para usuário ${userId} (${check.current}/${check.limit}) - Plano: ${check.planName}`);
    
    req.planLimitInfo = check;
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar limite de contas:', error);
    return sendError(res, 'Erro ao verificar limite de contas', 500, error.message);
  }
};

/**
 * Middleware para verificar acesso a features específicas
 * Uso: checkFeatureAccess('pdfExport')
 */
export const checkFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const check = await planLimitsService.canAccessFeature(userId, featureName);

      if (!check.allowed) {
        console.log(`🚫 [PLAN_LIMIT] Usuário ${userId} sem acesso à feature ${featureName} - Plano atual: ${check.planName}, Plano necessário: ${check.requiredPlan}`);
        
        return sendError(res, 'Feature não disponível no seu plano', 403, {
          feature: featureName,
          planName: check.planName,
          requiredPlan: check.requiredPlan,
          message: `A feature "${featureName}" requer o plano ${check.requiredPlan}. Faça upgrade para ter acesso.`,
          upgradeRequired: true
        });
      }

      console.log(`✅ [PLAN_LIMIT] Acesso à feature ${featureName} permitido para usuário ${userId} - Plano: ${check.planName}`);
      
      req.featureAccess = check;
      next();
    } catch (error) {
      console.error(`❌ Erro ao verificar acesso à feature ${featureName}:`, error);
      return sendError(res, 'Erro ao verificar acesso à feature', 500, error.message);
    }
  };
};

/**
 * Middleware para adicionar informações de limites ao request
 * Não bloqueia, apenas adiciona informações
 */
export const attachPlanLimits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limitsInfo = await planLimitsService.getUserLimitsInfo(userId);
    
    req.userPlanLimits = limitsInfo;
    next();
  } catch (error) {
    console.error('❌ Erro ao anexar informações de limites:', error);
    // Não bloqueia a requisição, apenas loga o erro
    next();
  }
};
