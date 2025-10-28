/**
 * Rotas para gerenciamento de perfil do usuário
 * Permite que o usuário edite suas próprias informações
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as userProfileController from '../controllers/userProfileController.js';

const router = express.Router();

// ========================================
// ROTAS DE PERFIL DO USUÁRIO AUTENTICADO
// ========================================

/**
 * @route   GET /api/users/profile
 * @desc    Buscar perfil do usuário autenticado
 * @access  Private
 */
router.get('/profile', authenticateToken, userProfileController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Atualizar perfil do usuário autenticado
 * @access  Private
 * @body    { name, phone, birth_date, cpf, company, position, bio }
 */
router.put('/profile', authenticateToken, userProfileController.updateProfile);

/**
 * @route   PUT /api/users/profile/password
 * @desc    Alterar senha do usuário
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put('/profile/password', authenticateToken, userProfileController.changePassword);

/**
 * @route   POST /api/users/profile/avatar
 * @desc    Upload de avatar do usuário
 * @access  Private
 * @body    FormData com campo 'avatar' (arquivo de imagem)
 */
router.post('/profile/avatar', authenticateToken, userProfileController.uploadAvatar);

/**
 * @route   DELETE /api/users/profile/avatar
 * @desc    Remover avatar do usuário
 * @access  Private
 */
router.delete('/profile/avatar', authenticateToken, userProfileController.removeAvatar);

/**
 * @route   GET /api/users/settings
 * @desc    Buscar configurações do usuário
 * @access  Private
 */
router.get('/settings', authenticateToken, userProfileController.getSettings);

/**
 * @route   PUT /api/users/settings
 * @desc    Atualizar configurações do usuário
 * @access  Private
 * @body    { language, currency, theme, notifications }
 */
router.put('/settings', authenticateToken, userProfileController.updateSettings);

/**
 * @route   DELETE /api/users/account
 * @desc    Deletar conta do usuário (soft delete)
 * @access  Private
 * @body    { confirmation: 'DELETE' }
 */
router.delete('/account', authenticateToken, userProfileController.deleteAccount);

export default router;
