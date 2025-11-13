/**
 * Plan Limits Service
 * Gerencia os limites e restrições de cada plano
 */

import { supabaseAdmin } from '../config/supabase.js';

// Definição dos limites de cada plano
export const PLAN_LIMITS = {
  GRATUITO: {
    name: 'Gratuito',
    maxTransactions: 10, // por mês
    maxCategories: 3,
    maxAccounts: 1,
    maxUsers: 1,
    features: {
      advancedDashboard: false,
      advancedCharts: false,
      pdfExport: false,
      excelExport: false,
      financialGoals: false,
      bankIntegration: false,
      autoImport: false,
      aiCategorization: false,
      customReports: false,
      apiIntegration: false,
      multiUser: false,
      prioritySupport: false,
      support24x7: false,
      dedicatedManager: false
    }
  },
  PRO: {
    name: 'Pro',
    maxTransactions: null, // ilimitado
    maxCategories: null, // ilimitado
    maxAccounts: null, // ilimitado
    maxUsers: 1,
    features: {
      advancedDashboard: true,
      advancedCharts: true,
      pdfExport: true,
      excelExport: true,
      financialGoals: true,
      bankIntegration: false,
      autoImport: false,
      aiCategorization: false,
      customReports: false,
      apiIntegration: false,
      multiUser: false,
      prioritySupport: true,
      support24x7: false,
      dedicatedManager: false
    }
  },
  PREMIUM: {
    name: 'Premium',
    maxTransactions: null, // ilimitado
    maxCategories: null, // ilimitado
    maxAccounts: null, // ilimitado
    maxUsers: 5,
    features: {
      advancedDashboard: true,
      advancedCharts: true,
      pdfExport: true,
      excelExport: true,
      financialGoals: true,
      bankIntegration: true,
      autoImport: true,
      aiCategorization: true,
      customReports: true,
      apiIntegration: true,
      multiUser: true,
      prioritySupport: true,
      support24x7: true,
      dedicatedManager: true
    }
  }
};

class PlanLimitsService {
  /**
   * Busca o plano atual do usuário
   */
  async getUserPlan(userId) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('plan_id, plans(*)')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Se não tem plano, retorna Gratuito por padrão
      if (!user.plan_id || !user.plans) {
        return this.getDefaultPlan();
      }

      return user.plans;
    } catch (error) {
      console.error('❌ Erro ao buscar plano do usuário:', error);
      return this.getDefaultPlan();
    }
  }

  /**
   * Retorna plano padrão (Gratuito)
   */
  getDefaultPlan() {
    return {
      id: null,
      name: 'Gratuito',
      price: 0
    };
  }

  /**
   * Obtém os limites do plano baseado nos dados do banco
   */
  getPlanLimits(plan) {
    // Se o plano não tem dados do banco, usa valores padrão hardcoded
    if (!plan || typeof plan === 'string') {
      const normalizedName = plan?.toUpperCase() || 'GRATUITO';
      return PLAN_LIMITS[normalizedName] || PLAN_LIMITS.GRATUITO;
    }

    // Usa os valores do banco de dados
    return {
      name: plan.name,
      maxTransactions: plan.max_transactions, // Do banco de dados
      maxCategories: plan.max_categories || PLAN_LIMITS[plan.name?.toUpperCase()]?.maxCategories || null,
      maxAccounts: plan.max_accounts || PLAN_LIMITS[plan.name?.toUpperCase()]?.maxAccounts || null,
      maxUsers: plan.max_users || PLAN_LIMITS[plan.name?.toUpperCase()]?.maxUsers || 1,
      features: PLAN_LIMITS[plan.name?.toUpperCase()]?.features || PLAN_LIMITS.GRATUITO.features
    };
  }

  /**
   * Verifica se o usuário pode criar uma transação
   */
  async canCreateTransaction(userId) {
    try {
      const plan = await this.getUserPlan(userId);
      const limits = this.getPlanLimits(plan); // Passa o objeto plan completo

      // Planos ilimitados (Pro e Premium)
      if (limits.maxTransactions === null) {
        return { allowed: true };
      }

      // Contar transações do mês atual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const { count, error } = await supabaseAdmin
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('date', firstDayOfMonth.toISOString())
        .lte('date', lastDayOfMonth.toISOString());

      if (error) throw error;

      const currentCount = count || 0;
      const allowed = currentCount < limits.maxTransactions;

      return {
        allowed,
        current: currentCount,
        limit: limits.maxTransactions,
        remaining: limits.maxTransactions - currentCount,
        planName: plan.name
      };
    } catch (error) {
      console.error('❌ Erro ao verificar limite de transações:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário pode criar uma categoria
   */
  async canCreateCategory(userId) {
    try {
      const plan = await this.getUserPlan(userId);
      const limits = this.getPlanLimits(plan); // Passa o objeto plan completo

      // Planos ilimitados (Pro e Premium)
      if (limits.maxCategories === null) {
        return { allowed: true };
      }

      // Contar categorias personalizadas do usuário
      const { count, error } = await supabaseAdmin
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;

      const currentCount = count || 0;
      const allowed = currentCount < limits.maxCategories;

      return {
        allowed,
        current: currentCount,
        limit: limits.maxCategories,
        remaining: limits.maxCategories - currentCount,
        planName: plan.name
      };
    } catch (error) {
      console.error('❌ Erro ao verificar limite de categorias:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário pode criar uma conta
   */
  async canCreateAccount(userId) {
    try {
      const plan = await this.getUserPlan(userId);
      const limits = this.getPlanLimits(plan); // Passa o objeto plan completo

      // Planos ilimitados (Pro e Premium)
      if (limits.maxAccounts === null) {
        return { allowed: true };
      }

      // Contar contas do usuário
      const { count, error } = await supabaseAdmin
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;

      const currentCount = count || 0;
      const allowed = currentCount < limits.maxAccounts;

      return {
        allowed,
        current: currentCount,
        limit: limits.maxAccounts,
        remaining: limits.maxAccounts - currentCount,
        planName: plan.name
      };
    } catch (error) {
      console.error('❌ Erro ao verificar limite de contas:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário pode acessar uma feature
   */
  async canAccessFeature(userId, featureName) {
    try {
      const plan = await this.getUserPlan(userId);
      const limits = this.getPlanLimits(plan); // Passa o objeto plan completo

      const hasAccess = limits.features[featureName] === true;

      return {
        allowed: hasAccess,
        planName: plan.name,
        feature: featureName,
        requiredPlan: this.getRequiredPlanForFeature(featureName)
      };
    } catch (error) {
      console.error('❌ Erro ao verificar acesso à feature:', error);
      throw error;
    }
  }

  /**
   * Retorna qual plano é necessário para uma feature
   */
  getRequiredPlanForFeature(featureName) {
    if (PLAN_LIMITS.GRATUITO.features[featureName]) return 'Gratuito';
    if (PLAN_LIMITS.PRO.features[featureName]) return 'Pro';
    if (PLAN_LIMITS.PREMIUM.features[featureName]) return 'Premium';
    return 'Premium'; // Por padrão, features não mapeadas exigem Premium
  }

  /**
   * Retorna informações completas sobre o uso e limites do usuário
   */
  async getUserLimitsInfo(userId) {
    try {
      const plan = await this.getUserPlan(userId);
      const limits = this.getPlanLimits(plan); // Passa o objeto plan completo

      const [transactions, categories, accounts] = await Promise.all([
        this.canCreateTransaction(userId),
        this.canCreateCategory(userId),
        this.canCreateAccount(userId)
      ]);

      return {
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price
        },
        limits: {
          transactions,
          categories,
          accounts
        },
        features: limits.features
      };
    } catch (error) {
      console.error('❌ Erro ao buscar informações de limites:', error);
      throw error;
    }
  }
}

export const planLimitsService = new PlanLimitsService();
