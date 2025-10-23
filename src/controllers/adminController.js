import {
  getAllUsersAdmin,
  updateUserRole,
  deleteUserAdmin,
  getSystemStats,
  getAllTransactionsAdmin,
} from '../services/adminService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsersAdmin();
    res.status(200).json(successResponse(users, 'Users retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json(errorResponse('Valid role is required (user or admin)'));
    }

    const user = await updateUserRole(id, role);

    res.status(200).json(successResponse(user, 'User role updated successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteUserAdmin(id);

    res.status(200).json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.status(200).json(successResponse(stats, 'System stats retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const getTransactions = async (req, res) => {
  try {
    const transactions = await getAllTransactionsAdmin();
    res.status(200).json(successResponse(transactions, 'Transactions retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};
