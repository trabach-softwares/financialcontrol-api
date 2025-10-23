import {
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
} from '../services/userService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAll = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(successResponse(users, 'Users retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    res.status(200).json(successResponse(user, 'User retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const update = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const user = await updateUser(userId, updates);

    res.status(200).json(successResponse(user, 'User updated successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(errorResponse('Current and new password are required'));
    }

    await updatePassword(userId, currentPassword, newPassword);

    res.status(200).json(successResponse(null, 'Password updated successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const remove = async (req, res) => {
  try {
    const userId = req.user.id;

    await deleteUser(userId);

    res.status(200).json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};
