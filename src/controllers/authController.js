import { registerUser, loginUser, getUserById } from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json(errorResponse('Email, password, and name are required'));
    }

    const result = await registerUser(email, password, name);

    res.status(201).json(successResponse(result, 'User registered successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    const result = await loginUser(email, password);

    res.status(200).json(successResponse(result, 'Login successful'));
  } catch (error) {
    res.status(401).json(errorResponse(error.message));
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserById(userId);

    res.status(200).json(successResponse(user, 'Profile retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
};
