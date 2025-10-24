import { userService } from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const userController = {
  async getProfile(req, res) {
    try {
      const profile = await userService.getProfile(req.user.id);
      return sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve profile', 400);
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const profile = await userService.updateProfile(req.user.id, { name, email });
      return sendSuccess(res, profile, 'Profile updated successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to update profile', 400);
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return sendError(res, 'Current password and new password are required', 400);
      }

      if (newPassword.length < 6) {
        return sendError(res, 'New password must be at least 6 characters long', 400);
      }

      await userService.changePassword(req.user.id, currentPassword, newPassword);
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to change password', 400);
    }
  },

  async updatePlan(req, res) {
    try {
      const { planId } = req.body;

      if (!planId) {
        return sendError(res, 'Plan ID is required', 400);
      }

      const user = await userService.updatePlan(req.user.id, planId);
      return sendSuccess(res, user, 'Plan updated successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to update plan', 400);
    }
  }
};
