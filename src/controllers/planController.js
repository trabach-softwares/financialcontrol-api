import { planService } from '../services/planService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const planController = {
  async getAll(req, res) {
    try {
      const plans = await planService.getAll();
      return sendSuccess(res, plans, 'Plans retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve plans', 400);
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const plan = await planService.getById(id);

      if (!plan) {
        return sendError(res, 'Plan not found', 404);
      }

      return sendSuccess(res, plan, 'Plan retrieved successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to retrieve plan', 400);
    }
  },

  async create(req, res) {
    try {
      const { name, description, price, features, max_transactions, is_active } = req.body;

      if (!name || price === undefined) {
        return sendError(res, 'Name and price are required', 400);
      }

      const plan = await planService.create({
        name,
        description,
        price,
        features,
        max_transactions,
        is_active
      });

      return sendSuccess(res, plan, 'Plan created successfully', 201);
    } catch (error) {
      return sendError(res, error.message || 'Failed to create plan', 400);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, features, max_transactions, is_active } = req.body;

      const plan = await planService.update(id, {
        name,
        description,
        price,
        features,
        max_transactions,
        is_active
      });

      if (!plan) {
        return sendError(res, 'Plan not found', 404);
      }

      return sendSuccess(res, plan, 'Plan updated successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to update plan', 400);
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await planService.delete(id);

      return sendSuccess(res, null, 'Plan deleted successfully');
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete plan', 400);
    }
  }
};
