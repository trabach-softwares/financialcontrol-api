import { supabaseAdmin } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, plan_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId) => {
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
};

export const updateUser = async (userId, updates) => {
  try {
    // Remove password from direct updates
    const { password, ...safeUpdates } = updates;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(safeUpdates)
      .eq('id', userId)
      .select('id, email, name, role, plan_id, created_at')
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (userId, currentPassword, newPassword) => {
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
};

export const deleteUser = async (userId) => {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    throw error;
  }
};
