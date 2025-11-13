import { dashboardService } from '../services/dashboardService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { validateDateParams } from '../utils/dateValidation.js';

export const dashboardController = {
  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const { start_date, end_date, startDate, endDate } = req.query;

      // Suporta tanto snake_case quanto camelCase
      const finalStartDate = start_date || startDate;
      const finalEndDate = end_date || endDate;

      // Valida parâmetros de data
      const dateValidation = validateDateParams(finalStartDate, finalEndDate);
      if (!dateValidation.valid) {
        return sendError(res, dateValidation.error, 400);
      }

      const stats = await dashboardService.getStats(userId, {
        startDate: finalStartDate,
        endDate: finalEndDate
      });
      
      return sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return sendError(res, 'Failed to get dashboard statistics', 500);
    }
  },

  async getCharts(req, res) {
    try {
      const userId = req.user.id;
      const { period, start_date, end_date, startDate, endDate } = req.query;

      // Suporta tanto snake_case quanto camelCase
      const finalStartDate = start_date || startDate;
      const finalEndDate = end_date || endDate;

      // Valida parâmetros de data
      const dateValidation = validateDateParams(finalStartDate, finalEndDate);
      if (!dateValidation.valid) {
        return sendError(res, dateValidation.error, 400);
      }
      
      const charts = await dashboardService.getCharts(userId, {
        period,
        startDate: finalStartDate,
        endDate: finalEndDate
      });
      
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