/**
 * Advanced Rate Limiter - Baseado em User ID
 * Mais adequado para sistemas com muitos usuários simultâneos
 * 
 * VANTAGENS:
 * - Cada usuário tem seu próprio limite
 * - Não afeta outros usuários do mesmo IP
 * - Melhor para aplicações em escala
 * 
 * QUANDO USAR:
 * - Em produção com muitos usuários
 * - Quando tiver muitos usuários por trás do mesmo IP (empresas, WiFi público)
 * - Para evitar bloqueio de usuários legítimos
 */

import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Rate limiter baseado em USER ID (requer autenticação)
 * Use este em rotas protegidas para melhor escalabilidade
 */
export const userBasedLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: isDev ? 1000 : 200, // 200 req/min por usuário = 12,000 req/hora
  
  // Usa o ID do usuário autenticado, fallback para IP
  keyGenerator: (req) => {
    // Se usuário está autenticado, usa o ID dele
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    // Fallback para IP (usuários não autenticados)
    return `ip:${req.ip}`;
  },
  
  message: {
    success: false,
    message: 'Você atingiu o limite de requisições. Aguarde um momento e tente novamente.',
    retryAfter: '1 minute'
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

/**
 * Rate limiter para rotas públicas (sem autenticação)
 * Mais restritivo pois usa IP
 */
export const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: isDev ? 1000 : 30, // 30 req/min por IP (mais restritivo)
  
  keyGenerator: (req) => req.ip,
  
  message: {
    success: false,
    message: 'Muitas requisições. Por favor, aguarde um momento.',
    retryAfter: '1 minute'
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

/**
 * Rate limiter específico por plano (Gratuito, Pro, Premium)
 * Diferentes limites baseado no plano do usuário
 */
export const planBasedLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  
  // Limite dinâmico baseado no plano
  max: (req) => {
    if (isDev) return 1000;
    
    // Verifica o plano do usuário (se disponível no req.user)
    const planName = req.user?.plans?.name || 'Gratuito';
    
    switch (planName.toUpperCase()) {
      case 'GRATUITO':
        return 60; // 60 req/min = 3,600 req/hora
      case 'PRO':
        return 120; // 120 req/min = 7,200 req/hora
      case 'PREMIUM':
        return 300; // 300 req/min = 18,000 req/hora
      default:
        return 60; // Padrão: Gratuito
    }
  },
  
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip}`;
  },
  
  message: (req) => {
    const planName = req.user?.plans?.name || 'Gratuito';
    return {
      success: false,
      message: `Limite de requisições atingido para o plano ${planName}. Faça upgrade para aumentar seus limites.`,
      currentPlan: planName,
      upgradeRequired: planName === 'Gratuito'
    };
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

/**
 * Rate limiter para endpoints de WRITE (POST, PUT, DELETE)
 * Mais restritivo que READ (GET)
 */
export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: isDev ? 1000 : 30, // 30 writes/min
  
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip}`;
  },
  
  message: {
    success: false,
    message: 'Você está fazendo muitas alterações. Aguarde um momento.'
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

/**
 * Rate limiter adaptativo - aumenta limite baseado em histórico
 * Usuários confiáveis (sem histórico de abuse) têm limite maior
 */
export const adaptiveLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  
  max: (req) => {
    if (isDev) return 1000;
    
    // Usuários autenticados têm limite maior
    if (req.user && req.user.id) {
      // Poderia verificar histórico do usuário aqui
      // Por enquanto, apenas dá limite maior para autenticados
      return 150;
    }
    
    // Não autenticados: limite menor
    return 30;
  },
  
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip}`;
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export default {
  userBasedLimiter,
  publicLimiter,
  planBasedLimiter,
  writeLimiter,
  adaptiveLimiter
};
