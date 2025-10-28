/**
 * Controller para gerenciamento de perfil do usuário
 */

import { supabaseAdmin } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// CONFIGURAÇÃO DO MULTER PARA UPLOAD DE AVATAR
// ========================================

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
    }
  }
}).single('avatar');

// ========================================
// CONTROLADORES
// ========================================

/**
 * Buscar perfil do usuário autenticado
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    // Buscar usuário com informações do plano
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, 
        email, 
        name, 
        role, 
        phone, 
        birth_date, 
        cpf, 
        company, 
        position, 
        bio, 
        avatar,
        plan_id,
        last_login,
        created_at, 
        updated_at,
        plans (
          id,
          name,
          description,
          price,
          features
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Reestruturar resposta
    const userData = {
      ...user,
      plan: user.plans || null
    };
    delete userData.plans;

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil do usuário',
      error: error.message
    });
  }
};

/**
 * Atualizar perfil do usuário
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, birth_date, cpf, company, position, bio } = req.body;

    // 🔍 LOG DO PAYLOAD RECEBIDO
    console.log('📥 [BACKEND UPDATE PROFILE] ==========================================');
    console.log('📥 [BACKEND UPDATE PROFILE] userId:', userId);
    console.log('📥 [BACKEND UPDATE PROFILE] Payload recebido:');
    console.log('📥 [BACKEND UPDATE PROFILE] JSON:', JSON.stringify(req.body, null, 2));
    console.log('📥 [BACKEND UPDATE PROFILE] Campos:', Object.keys(req.body).join(', '));
    console.log('📥 [BACKEND UPDATE PROFILE] ==========================================');

    // Validações básicas
    if (!name || name.trim().length === 0) {
      console.warn('⚠️ [BACKEND UPDATE PROFILE] Validação falhou: Nome é obrigatório');
      return res.status(400).json({
        success: false,
        message: 'Nome é obrigatório'
      });
    }

    // Validar CPF se fornecido
    if (cpf) {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(cpf)) {
        return res.status(400).json({
          success: false,
          message: 'CPF inválido. Use o formato: ###.###.###-##'
        });
      }
    }

    // Validar telefone se fornecido
    if (phone) {
      const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Telefone inválido. Use o formato: (##) #####-####'
        });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        phone,
        birth_date,
        cpf,
        company,
        position,
        bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, name, role, phone, birth_date, cpf, company, position, bio, avatar, plan_id, created_at, updated_at')
      .single();

    if (error || !data) {
      console.error('❌ [BACKEND UPDATE PROFILE] Erro Supabase:', error);
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // 🔍 LOG DA RESPOSTA ANTES DE ENVIAR
    console.log('✅ [BACKEND UPDATE PROFILE] ==========================================');
    console.log('✅ [BACKEND UPDATE PROFILE] Update realizado com sucesso!');
    console.log('✅ [BACKEND UPDATE PROFILE] Dados atualizados:');
    console.log('✅ [BACKEND UPDATE PROFILE] JSON:', JSON.stringify(data, null, 2));
    console.log('✅ [BACKEND UPDATE PROFILE] ==========================================');

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data
    });
  } catch (error) {
    console.error('❌ [BACKEND UPDATE PROFILE] ==========================================');
    console.error('❌ [BACKEND UPDATE PROFILE] Erro ao atualizar perfil:', error);
    console.error('❌ [BACKEND UPDATE PROFILE] Stack:', error.stack);
    console.error('❌ [BACKEND UPDATE PROFILE] ==========================================');
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: error.message
    });
  }
};

/**
 * Alterar senha do usuário
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    // Validações
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar senha atual do usuário
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar senha',
      error: error.message
    });
  }
};

/**
 * Upload de avatar
 */
export const uploadAvatar = (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Arquivo muito grande. Máximo: 2MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    try {
      const userId = req.userId;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Buscar avatar anterior para deletar
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('avatar')
        .eq('id', userId)
        .single();

      // Atualizar avatar no banco
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          avatar: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Deletar avatar anterior se existir
      if (userData?.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../', userData.avatar);
        try {
          await fs.unlink(oldAvatarPath);
        } catch (error) {
          // Ignorar erro se arquivo não existir
          console.log('Avatar anterior não encontrado para deletar');
        }
      }

      res.json({
        success: true,
        message: 'Avatar atualizado com sucesso',
        data: {
          avatarUrl: avatarUrl
        }
      });
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload do avatar',
        error: error.message
      });
    }
  });
};

/**
 * Remover avatar
 */
export const removeAvatar = async (req, res) => {
  try {
    const userId = req.userId;

    // Buscar avatar atual
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('avatar')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const avatarPath = user.avatar;

    // Remover avatar do banco
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        avatar: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Deletar arquivo se existir
    if (avatarPath) {
      const fullPath = path.join(__dirname, '../../', avatarPath);
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.log('Avatar não encontrado no sistema de arquivos');
      }
    }

    res.json({
      success: true,
      message: 'Avatar removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover avatar',
      error: error.message
    });
  }
};

/**
 * Buscar configurações do usuário
 */
export const getSettings = async (req, res) => {
  try {
    const userId = req.userId;

    // Por enquanto, retornar configurações padrão
    // Você pode criar uma tabela user_settings depois
    res.json({
      success: true,
      data: {
        language: 'pt-BR',
        currency: 'BRL',
        theme: 'light',
        notifications: {
          email: true,
          push: false,
          sms: false
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações',
      error: error.message
    });
  }
};

/**
 * Atualizar configurações do usuário
 */
export const updateSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const settings = req.body;

    // Por enquanto, apenas retornar sucesso
    // Você pode criar uma tabela user_settings depois
    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: settings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações',
      error: error.message
    });
  }
};

/**
 * Deletar conta do usuário (soft delete)
 */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Confirmação inválida. Digite "DELETE" para confirmar'
      });
    }

    // Soft delete: apenas desativar conta
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        email: `deleted_${userId}@deleted.com`,
        name: 'Conta Deletada',
        avatar: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Conta deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar conta',
      error: error.message
    });
  }
};
