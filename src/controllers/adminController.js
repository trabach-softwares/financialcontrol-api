import { adminService } from '../services/adminService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const adminController = {
  async getAllUsers(req, res) {
    try {
      const { role, plan_id } = req.query;
      const users = await adminService.getAllUsers({ role, plan_id });
      return sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve users', 400);
    }
  },

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await adminService.getUserById(id);

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve user', 400);
    }
  },

  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'admin'].includes(role)) {
        return sendError(res, 'Valid role is required (user or admin)', 400);
      }

      const user = await adminService.updateUserRole(id, role);
      return sendSuccess(res, user, 'User role updated successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to update user role', 400);
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await adminService.deleteUser(id);
      return sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete user', 400);
    }
  },

  async getStats(req, res) {
    try {
      const stats = await adminService.getStats();
      return sendSuccess(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve statistics', 400);
    }
  }
};
