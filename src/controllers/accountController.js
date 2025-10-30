import { celebrate, Joi, Segments } from 'celebrate';
import { accountService } from '../services/accountService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const accountPayloadSchema = Joi.object({
  name: Joi.string().max(150).required(),
  bankName: Joi.string().max(150).allow(null, '').default(null),
  bankCode: Joi.string().max(20).allow(null, '').default(null),
  branch: Joi.string().max(20).allow(null, '').default(null),
  accountNumber: Joi.string().max(30).allow(null, '').default(null),
  accountType: Joi.string().valid('checking', 'savings', 'investment', 'digital').default('checking'),
  currency: Joi.string().max(10).default('BRL'),
  openingBalance: Joi.number().precision(2).min(0).default(0),
  currentBalance: Joi.number().precision(2).min(0),
  creditLimit: Joi.number().precision(2).min(0).default(0),
  status: Joi.string().valid('active', 'archived').default('active'),
  icon: Joi.string().max(100).allow(null, '').default(null),
  color: Joi.string().max(30).allow(null, '').default(null),
  notes: Joi.string().allow(null, '').default(null)
});

const accountUpdateSchema = accountPayloadSchema.fork(['name', 'accountType'], (schema) => schema.optional());

const idParamSchema = Joi.string().guid({ version: 'uuidv4' }).required();

export const accountValidators = {
  create: celebrate({ [Segments.BODY]: accountPayloadSchema }),
  update: celebrate({
    [Segments.PARAMS]: Joi.object({ id: idParamSchema }),
    [Segments.BODY]: accountUpdateSchema
  }),
  idParam: celebrate({
    [Segments.PARAMS]: Joi.object({ id: idParamSchema })
  })
};

export const accountController = {
  async create(req, res) {
    try {
      const account = await accountService.create(req.user.id, req.body);
      return sendSuccess(res, account, 'Account created successfully', 201);
    } catch (error) {
      return sendError(res, error.message || 'Failed to create account', 400);
    }
  },

  async list(req, res) {
    try {
      const accounts = await accountService.list(req.user.id);
      return sendSuccess(res, accounts, 'Accounts retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve accounts', 400);
    }
  },

  async getById(req, res) {
    try {
      const account = await accountService.getById(req.user.id, req.params.id);
      if (!account) {
        return sendError(res, 'Account not found', 404);
      }
      return sendSuccess(res, account, 'Account retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve account', 400);
    }
  },

  async update(req, res) {
    try {
      const account = await accountService.update(req.user.id, req.params.id, req.body);
      if (!account) {
        return sendError(res, 'Account not found', 404);
      }
      return sendSuccess(res, account, 'Account updated successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to update account', 400);
    }
  },

  async archive(req, res) {
    try {
      const account = await accountService.archive(req.user.id, req.params.id);
      if (!account) {
        return sendError(res, 'Account not found', 404);
      }
      return sendSuccess(res, account, 'Account archived successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to archive account', 400);
    }
  },

  async delete(req, res) {
    try {
      const deleted = await accountService.delete(req.user.id, req.params.id);
      if (!deleted) {
        return sendError(res, 'Account not found', 404);
      }
      return sendSuccess(res, null, 'Account deleted successfully', 200);
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete account', 400);
    }
  },

  async getSummary(req, res) {
    try {
      const summary = await accountService.getSummary(req.user.id);
      return sendSuccess(res, summary, 'Account summary retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve account summary', 400);
    }
  }
};
