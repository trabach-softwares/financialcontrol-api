import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development'

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: isDev ? (1 * 60 * 1000) : (15 * 60 * 1000), // 1min em dev, 15min em prod
  max: isDev ? 50 : 5, // Mais permissivo em dev
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Em dev, não contar logins bem-sucedidos para evitar bloqueios durante testes
  skipSuccessfulRequests: isDev,
});

// Rate limiter for admin endpoints
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
