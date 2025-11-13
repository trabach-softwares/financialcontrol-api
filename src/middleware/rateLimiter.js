import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';

// General API rate limiter - OTIMIZADO PARA ESCALA
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (janela menor, mais granular)
  max: isDev ? 1000 : 100, // 100 req/min em prod = 6000 req/hora
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Retorna info no header: RateLimit-*
  legacyHeaders: false,
  skip: () => isDev, // Desabilita completamente em desenvolvimento
  
  // IMPORTANTE: Em produção, considere usar keyGenerator baseado em user ID
  // keyGenerator: (req) => req.user?.id || req.ip,
  
  // Permite burst de requisições mas limita no agregado
  skipSuccessfulRequests: false,
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: isDev ? (1 * 60 * 1000) : (15 * 60 * 1000), // 15min em prod
  max: isDev ? 100 : 10, // 10 tentativas em prod (mais realista que 5)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não conta logins bem-sucedidos
  skip: () => isDev,
});

// Rate limiter for admin endpoints
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: isDev ? 500 : 60, // 60 req/min em prod
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});
