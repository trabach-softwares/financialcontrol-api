/**
 * Plan Features Helper
 * Funções auxiliares para trabalhar com features de planos
 */

import { planLimitsService, PLAN_LIMITS } from '../services/planLimitsService.js';

/**
 * Verifica se feature está disponível e lança erro se não estiver
 * @param {string} userId - ID do usuário
 * @param {string} featureName - Nome da feature
 * @throws {Error} Se feature não estiver disponível
 */
export async function requireFeature(userId, featureName) {
  const check = await planLimitsService.canAccessFeature(userId, featureName);
  
  if (!check.allowed) {
    const error = new Error(`Feature ${featureName} não disponível no plano ${check.planName}`);
    error.status = 403;
    error.data = {
      feature: featureName,
      planName: check.planName,
      requiredPlan: check.requiredPlan,
      upgradeRequired: true
    };
    throw error;
  }
  
  return true;
}

/**
 * Retorna lista de features disponíveis para o usuário
 * @param {string} userId - ID do usuário
 * @returns {Object} Objeto com features e seus status
 */
export async function getUserFeatures(userId) {
  const plan = await planLimitsService.getUserPlan(userId);
  const limits = planLimitsService.getPlanLimits(plan.name);
  
  return {
    planName: plan.name,
    features: limits.features
  };
}

/**
 * Verifica se o usuário tem plano Pro ou superior
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
export async function isProOrHigher(userId) {
  const plan = await planLimitsService.getUserPlan(userId);
  return ['Pro', 'Premium'].includes(plan.name);
}

/**
 * Verifica se o usuário tem plano Premium
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
export async function isPremium(userId) {
  const plan = await planLimitsService.getUserPlan(userId);
  return plan.name === 'Premium';
}

/**
 * Verifica se o usuário está no plano gratuito
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
export async function isFree(userId) {
  const plan = await planLimitsService.getUserPlan(userId);
  return plan.name === 'Gratuito' || !plan.name;
}

/**
 * Retorna mensagem amigável de upgrade
 * @param {string} currentPlan - Plano atual
 * @param {string} requiredPlan - Plano necessário
 * @returns {string}
 */
export function getUpgradeMessage(currentPlan, requiredPlan) {
  const messages = {
    'Gratuito-Pro': '🚀 Faça upgrade para o plano Pro por apenas R$ 29,90/mês e tenha acesso a transações ilimitadas, dashboard avançado e muito mais!',
    'Gratuito-Premium': '⭐ Faça upgrade para o plano Premium por R$ 89,90/mês e tenha acesso completo a todas as features, incluindo integração bancária e IA!',
    'Pro-Premium': '⭐ Upgrade para Premium por R$ 89,90/mês e desbloqueie integração bancária, IA para categorização, multi-usuários e suporte 24/7!'
  };
  
  const key = `${currentPlan}-${requiredPlan}`;
  return messages[key] || `Faça upgrade para o plano ${requiredPlan} para ter acesso a esta funcionalidade.`;
}

/**
 * Formata informações de limite para exibição
 * @param {Object} limitInfo - Informação de limite retornada pelo service
 * @returns {Object} Informação formatada
 */
export function formatLimitInfo(limitInfo) {
  if (limitInfo.limit === null) {
    return {
      ...limitInfo,
      displayText: 'Ilimitado',
      percentage: 0,
      isNearLimit: false
    };
  }
  
  const percentage = (limitInfo.current / limitInfo.limit) * 100;
  const isNearLimit = percentage >= 80;
  
  return {
    ...limitInfo,
    displayText: `${limitInfo.current} de ${limitInfo.limit}`,
    percentage: Math.round(percentage),
    isNearLimit,
    warningLevel: percentage >= 90 ? 'danger' : (isNearLimit ? 'warning' : 'normal')
  };
}

/**
 * Lista todas as features com seus planos necessários
 * @returns {Object} Mapeamento de features e planos
 */
export function getFeaturesList() {
  return {
    // Features do plano Pro
    advancedDashboard: { name: 'Dashboard Avançado', requiredPlan: 'Pro' },
    advancedCharts: { name: 'Gráficos Avançados', requiredPlan: 'Pro' },
    pdfExport: { name: 'Exportação PDF', requiredPlan: 'Pro' },
    excelExport: { name: 'Exportação Excel', requiredPlan: 'Pro' },
    financialGoals: { name: 'Metas Financeiras', requiredPlan: 'Pro' },
    prioritySupport: { name: 'Suporte Prioritário', requiredPlan: 'Pro' },
    
    // Features do plano Premium
    bankIntegration: { name: 'Integração Bancária', requiredPlan: 'Premium' },
    autoImport: { name: 'Importação Automática', requiredPlan: 'Premium' },
    aiCategorization: { name: 'IA para Categorização', requiredPlan: 'Premium' },
    customReports: { name: 'Relatórios Personalizados', requiredPlan: 'Premium' },
    apiIntegration: { name: 'API para Integrações', requiredPlan: 'Premium' },
    multiUser: { name: 'Multi-usuários', requiredPlan: 'Premium' },
    support24x7: { name: 'Suporte 24/7', requiredPlan: 'Premium' },
    dedicatedManager: { name: 'Manager Dedicado', requiredPlan: 'Premium' }
  };
}

/**
 * Retorna cor baseada no percentual de uso
 * @param {number} percentage - Percentual de uso (0-100)
 * @returns {string} Classe CSS ou cor
 */
export function getLimitColor(percentage) {
  if (percentage >= 90) return 'danger'; // Vermelho
  if (percentage >= 80) return 'warning'; // Amarelo
  if (percentage >= 50) return 'info'; // Azul
  return 'success'; // Verde
}

/**
 * Gera sugestão de upgrade baseado no uso
 * @param {Object} limitsInfo - Informações completas de limites
 * @returns {Object|null} Sugestão de upgrade ou null
 */
export function getUpgradeSuggestion(limitsInfo) {
  if (!limitsInfo.plan || limitsInfo.plan.name === 'Premium') {
    return null; // Já está no melhor plano
  }
  
  const { transactions, categories, accounts } = limitsInfo.limits;
  
  // Verifica se atingiu algum limite
  const hasReachedLimit = 
    !transactions.allowed || 
    !categories.allowed || 
    !accounts.allowed;
  
  // Verifica se está próximo do limite (>80%)
  const isNearLimit = 
    (transactions.limit && (transactions.current / transactions.limit) > 0.8) ||
    (categories.limit && (categories.current / categories.limit) > 0.8) ||
    (accounts.limit && (accounts.current / accounts.limit) > 0.8);
  
  if (hasReachedLimit) {
    return {
      urgency: 'high',
      reason: 'limit-reached',
      message: '⚠️ Você atingiu o limite do seu plano. Faça upgrade para continuar usando todos os recursos.',
      suggestedPlan: limitsInfo.plan.name === 'Gratuito' ? 'Pro' : 'Premium',
      priority: 1
    };
  }
  
  if (isNearLimit) {
    return {
      urgency: 'medium',
      reason: 'near-limit',
      message: '⚡ Você está próximo do limite do seu plano. Considere fazer upgrade para ter mais liberdade.',
      suggestedPlan: limitsInfo.plan.name === 'Gratuito' ? 'Pro' : 'Premium',
      priority: 2
    };
  }
  
  return {
    urgency: 'low',
    reason: 'feature-unlock',
    message: '🚀 Desbloqueie recursos avançados como gráficos, exportação e muito mais!',
    suggestedPlan: limitsInfo.plan.name === 'Gratuito' ? 'Pro' : 'Premium',
    priority: 3
  };
}

export default {
  requireFeature,
  getUserFeatures,
  isProOrHigher,
  isPremium,
  isFree,
  getUpgradeMessage,
  formatLimitInfo,
  getFeaturesList,
  getLimitColor,
  getUpgradeSuggestion
};
