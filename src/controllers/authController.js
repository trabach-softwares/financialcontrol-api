import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/response.js';

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
  }
};
