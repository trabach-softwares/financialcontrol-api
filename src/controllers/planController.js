import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  subscribeToPlan,
} from '../services/planService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAll = async (req, res) => {
  try {
    const plans = await getAllPlans();
    res.status(200).json(successResponse(plans, 'Plans retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);

    if (!plan) {
      return res.status(404).json(errorResponse('Plan not found'));
    }

    res.status(200).json(successResponse(plan, 'Plan retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const create = async (req, res) => {
  try {
    const { name, description, price, features } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json(errorResponse('Name and price are required'));
    }

    const plan = await createPlan({ name, description, price, features });

    res.status(201).json(successResponse(plan, 'Plan created successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await updatePlan(id, updates);

    if (!plan) {
      return res.status(404).json(errorResponse('Plan not found'));
    }

    res.status(200).json(successResponse(plan, 'Plan updated successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await deletePlan(id);

    res.status(200).json(successResponse(null, 'Plan deleted successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json(errorResponse('Plan ID is required'));
    }

    const user = await subscribeToPlan(userId, planId);

    res.status(200).json(successResponse(user, 'Subscribed to plan successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};
