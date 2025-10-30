import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { jwtConfig } from '../config/jwt.js';

export const authService = {
  async register(email, password, name) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert([
          {
            email,
            password: hashedPassword,
            name,
            role: 'user',
            plan_id: null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      try {
        await supabaseAdmin.rpc('seed_default_account', { target_user: user.id });
      } catch (seedError) {
        console.warn('[authService.register] seed_default_account failed', seedError?.message);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      };
    } catch (error) {
      throw error;
    }
  },

  async login(email, password) {
    try {
      // Get user by email
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last_login timestamp
      const nowIso = new Date().toISOString();
      try {
        await supabaseAdmin
          .from('users')
          .update({ last_login: nowIso })
          .eq('id', user.id);
      } catch (_) {
        // ignore update error
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          last_login: nowIso
        },
        token
      };
    } catch (error) {
      throw error;
    }
  },

  async devResetPasswordByEmail(email, newPassword) {
    // Somente permitir em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Not allowed in this environment')
    }
    // Buscar usuário
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    if (error || !user) {
      throw new Error('User not found')
    }
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id)
    if (updateError) {
      throw new Error('Failed to reset password')
    }
    return true
  }
};
