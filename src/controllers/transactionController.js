import { transactionService } from '../services/transactionService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const transactionController = {
  async create(req, res) {
    try {
      const { type, amount, description, category, date } = req.body;

      if (!type || !amount) {
        return sendError(res, 'Type and amount are required', 400);
      }

      if (!['income', 'expense'].includes(type)) {
        return sendError(res, 'Type must be either "income" or "expense"', 400);
      }

      const transaction = await transactionService.create(req.user.id, {
        type,
        amount,
        description,
        category,
        date
      });

      return sendSuccess(res, transaction, 'Transaction created successfully', 201);
    } catch (error) {
      return sendError(res, error.message || 'Failed to create transaction', 400);
    }
  },

  async getAll(req, res) {
    try {
      const { type, category, startDate, endDate, limit, sort, page } = req.query;
      
      const transactions = await transactionService.getAll(req.user.id, {
        type,
        category,
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : undefined,
        sort,
        page: page ? parseInt(page) : undefined
      });

      return sendSuccess(res, transactions, 'Transactions retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve transactions', 400);
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const transaction = await transactionService.getById(req.user.id, id);

      if (!transaction) {
        return sendError(res, 'Transaction not found', 404);
      }

      return sendSuccess(res, transaction, 'Transaction retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve transaction', 400);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { type, amount, description, category, date } = req.body;

      const transaction = await transactionService.update(req.user.id, id, {
        type,
        amount,
        description,
        category,
        date
      });

      if (!transaction) {
        return sendError(res, 'Transaction not found', 404);
      }

      return sendSuccess(res, transaction, 'Transaction updated successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to update transaction', 400);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await transactionService.delete(req.user.id, id);

      return sendSuccess(res, null, 'Transaction deleted successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete transaction', 400);
    }
  },

  async getStats(req, res) {
    try {
      const stats = await transactionService.getStats(req.user.id);
      return sendSuccess(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve statistics', 400);
    }
  },

  async getTimeline(req, res) {
    try {
      const { period = '6months' } = req.query;
      const timeline = await transactionService.getTimeline(req.user.id, period);
      return sendSuccess(res, timeline, 'Timeline retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve statistics', 400);
    }
  }
};
