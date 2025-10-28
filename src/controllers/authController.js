import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export const authController = {
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return sendError(res, 'Email, password and name are required', 400);
      }

      const result = await authService.register(email, password, name);
      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      return sendError(res, error.message || 'Registration failed', 400);
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 'Email and password are required', 400);
      }

      const result = await authService.login(email, password);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      return sendError(res, error.message || 'Login failed', 401);
    }
  },

  async me(req, res) {
    try {
      const userWithPlan = await userService.getProfileWithPlan(req.user.id);
      return sendSuccess(res, { user: userWithPlan }, 'User data retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to get user data', 400);
    }
  },

  async refresh(req, res) {
    try {
      // Requer autenticação prévia via middleware (req.user)
      const user = await userService.getProfileWithPlan(req.user.id);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      // Gerar novo token com mesmo payload mínimo (id, email, role)
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      // Retornar token novo e dados mínimos do usuário
      return sendSuccess(res, { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }, 'Session refreshed');
    } catch (error) {
      return sendError(res, error.message || 'Failed to refresh session', 400);
    }
  },

  async logout(req, res) {
    try {
      // Stateless JWT: apenas responde sucesso. Caso implementem blacklist, adicionar aqui.
      return sendSuccess(res, { success: true }, 'Logout successful');
    } catch (error) {
      return sendError(res, error.message || 'Logout failed', 400);
    }
  },

  async devResetPassword(req, res) {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return sendError(res, 'Not allowed in this environment', 403)
      }
      const { email, newPassword } = req.body
      if (!email || !newPassword) {
        return sendError(res, 'Email and newPassword are required', 400)
      }
      await authService.devResetPasswordByEmail(email, newPassword)
      return sendSuccess(res, { ok: true }, 'Password reset successfully')
    } catch (error) {
      return sendError(res, error.message || 'Password reset failed', 400)
    }
  }
};
