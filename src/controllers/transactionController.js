import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
} from '../services/transactionService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category || !date) {
      return res.status(400).json(errorResponse('Type, amount, category, and date are required'));
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json(errorResponse('Type must be either "income" or "expense"'));
    }

    const transaction = await createTransaction(userId, {
      type,
      amount,
      category,
      description,
      date,
    });

    res.status(201).json(successResponse(transaction, 'Transaction created successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const getAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, category, startDate, endDate } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const transactions = await getTransactions(userId, filters);

    res.status(200).json(successResponse(transactions, 'Transactions retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const getOne = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const transaction = await getTransactionById(userId, id);

    if (!transaction) {
      return res.status(404).json(errorResponse('Transaction not found'));
    }

    res.status(200).json(successResponse(transaction, 'Transaction retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const update = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    // Validate type if provided
    if (updates.type && !['income', 'expense'].includes(updates.type)) {
      return res.status(400).json(errorResponse('Type must be either "income" or "expense"'));
    }

    const transaction = await updateTransaction(userId, id, updates);

    if (!transaction) {
      return res.status(404).json(errorResponse('Transaction not found'));
    }

    res.status(200).json(successResponse(transaction, 'Transaction updated successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const remove = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await deleteTransaction(userId, id);

    res.status(200).json(successResponse(null, 'Transaction deleted successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await getTransactionsSummary(userId);

    res.status(200).json(successResponse(summary, 'Summary retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};
