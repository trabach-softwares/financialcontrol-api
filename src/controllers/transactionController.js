import { celebrate, Joi, Segments } from 'celebrate';
import { transactionService } from '../services/transactionService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const accountIdParamSchema = Joi.string().guid({ version: 'uuidv4' }).required();

const statementQuerySchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().max(150),
  search: Joi.string().max(255),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(500),
  sort: Joi.string().valid('asc', 'desc'),
}).unknown(false);

const statementExportQuerySchema = statementQuerySchema.keys({
  format: Joi.string().valid('csv', 'xlsx', 'pdf').default('csv'),
});

export const transactionValidators = {
  accountStatement: celebrate({
    [Segments.PARAMS]: Joi.object({ accountId: accountIdParamSchema }),
    [Segments.QUERY]: statementQuerySchema,
  }),
  accountStatementExport: celebrate({
    [Segments.PARAMS]: Joi.object({ accountId: accountIdParamSchema }),
    [Segments.QUERY]: statementExportQuerySchema,
  }),
};

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
  ,
  async getAccountStatement(req, res) {
    try {
      const { accountId } = req.params;
      const statement = await transactionService.getAccountStatement(req.user.id, accountId, req.query);
      return sendSuccess(res, statement, 'Account statement retrieved successfully');
    } catch (error) {
      const status = error.statusCode || error.status || 400;
      return sendError(res, error.message || 'Failed to retrieve account statement', status);
    }
  }
  ,
  async exportAccountStatement(req, res) {
    try {
      const { accountId } = req.params;
      const report = await transactionService.exportAccountStatement(req.user.id, accountId, req.query);

      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);

      return res.status(200).send(report.data);
    } catch (error) {
      const status = error.statusCode || error.status || 400;
      return sendError(res, error.message || 'Failed to export account statement', status);
    }
  }
};
