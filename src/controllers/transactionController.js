import { transactionService } from '../services/transactionService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const transactionController = {
  async create(req, res) {
    try {
      console.debug('[transactions:create] user', req.user?.id, 'body', req.body)
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

      console.debug('[transactions:create] created', transaction)
      return sendSuccess(res, transaction, 'Transaction created successfully', 201);
    } catch (error) {
      console.error('[transactions:create] error', error?.message, error)
      return sendError(res, error.message || 'Failed to create transaction', 400);
    }
  },

  async createBulk(req, res) {
    try {
      const payload = Array.isArray(req.body) ? req.body : (req.body?.transactions || [])
      if (!Array.isArray(payload) || payload.length === 0) {
        return sendError(res, 'Transactions array is required', 400)
      }
      const created = await transactionService.createBulk(req.user.id, payload)
      return sendSuccess(res, created, 'Transactions created successfully', 201)
    } catch (error) {
      return sendError(res, error.message || 'Failed to create transactions', 400)
    }
  },

  async getAll(req, res) {
    try {
      const { type, category, startDate, endDate, limit, sort, page, paid } = req.query;
      
      const transactions = await transactionService.getAll(req.user.id, {
        type,
        category,
        startDate,
        endDate,
        paid: typeof paid === 'string' && paid !== '' ? paid === 'true' : undefined,
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
      const { startDate, endDate } = req.query;
      const stats = await transactionService.getStats(req.user.id, { startDate, endDate });
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
  ,
  async markPaid(req, res) {
    try {
      const { id } = req.params;
      const { paid, paidAt } = req.body;
      if (typeof paid !== 'boolean') {
        return sendError(res, 'Field "paid" must be boolean', 400);
      }

      const tx = await transactionService.update(req.user.id, id, { paid, paidAt });
      if (!tx) {
        return sendError(res, 'Transaction not found', 404);
      }
      return sendSuccess(res, tx, 'Transaction paid status updated successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to update paid status', 400);
    }
  }
  ,
  async getSeries(req, res) {
    try {
      const { seriesId } = req.params
      const series = await transactionService.getSeries(req.user.id, seriesId)
      return sendSuccess(res, series, 'Series retrieved successfully')
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve series', 400)
    }
  }
  ,
  async updateSeries(req, res) {
    try {
      const { seriesId } = req.params
      const payload = req.body || {}
      const updated = await transactionService.updateSeries(req.user.id, seriesId, payload)
      return sendSuccess(res, updated, 'Series updated successfully')
    } catch (error) {
      return sendError(res, error.message || 'Failed to update series', 400)
    }
  }
  ,
  async markSeriesPaidForward(req, res) {
    try {
      const { seriesId } = req.params
      const { fromDate, paid, paidAt } = req.body
      if (typeof paid !== 'boolean') {
        return sendError(res, 'Field "paid" must be boolean', 400)
      }
      const result = await transactionService.markSeriesPaidForward(req.user.id, seriesId, { fromDate, paid, paidAt })
      return sendSuccess(res, result, 'Series paid status updated successfully')
    } catch (error) {
      return sendError(res, error.message || 'Failed to update series paid status', 400)
    }
  }
  ,
  async deleteSeriesForward(req, res) {
    try {
      const { seriesId } = req.params
      const { fromDate } = req.query
      console.debug('[transactions:series:deleteForward] user', req.user?.id, 'seriesId', seriesId, 'fromDate', fromDate)
      const result = await transactionService.deleteSeriesForward(req.user.id, seriesId, fromDate)
      console.debug('[transactions:series:deleteForward] deleted count', result)
      return sendSuccess(res, { deleted: result }, 'Series installments deleted successfully')
    } catch (error) {
      console.error('[transactions:series:deleteForward] error', error?.message, error)
      return sendError(res, error.message || 'Failed to delete series installments', 400)
    }
  }
};
