import { dashboardService } from '../services/dashboardService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const dashboardController = {
  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await dashboardService.getStats(userId);
      
      return sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return sendError(res, 'Failed to get dashboard statistics', 500);
    }
  },

  async getCharts(req, res) {
    try {
      const userId = req.user.id;
      const { period = '6months' } = req.query;
      
      const charts = await dashboardService.getCharts(userId, period);
      
      return sendSuccess(res, charts, 'Dashboard charts retrieved successfully');
    } catch (error) {
      console.error('Error getting dashboard charts:', error);
      return sendError(res, 'Failed to get dashboard charts', 500);
    }
  },

  async getRecent(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 5 } = req.query;
      
      const recent = await dashboardService.getRecent(userId, parseInt(limit));
      
      return sendSuccess(res, recent, 'Recent transactions retrieved successfully');
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return sendError(res, 'Failed to get recent transactions', 500);
    }
  }
};