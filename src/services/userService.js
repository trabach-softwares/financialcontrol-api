import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';

export const userService = {
  async getProfile(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, plan_id, created_at')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async updateProfile(userId, updates) {
    try {
      const updateData = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, name, role, plan_id')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password
      const { data: user, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', userId);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      throw error;
    }
  },

  async updatePlan(userId, planId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ plan_id: planId })
        .eq('id', userId)
        .select('id, email, name, role, plan_id')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }
};
