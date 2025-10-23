import { supabaseAdmin } from '../config/supabase.js';

export const getAllUsersAdmin = async () => {
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

export const updateUserRole = async (userId, role) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, email, name, role, plan_id, created_at')
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteUserAdmin = async (userId) => {
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

export const getSystemStats = async () => {
  try {
    // Get total users
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get total transactions
    const { count: totalTransactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (transactionsError) throw transactionsError;

    // Get total plans
    const { count: totalPlans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('*', { count: 'exact', head: true });

    if (plansError) throw plansError;

    return {
      totalUsers: totalUsers || 0,
      totalTransactions: totalTransactions || 0,
      totalPlans: totalPlans || 0,
    };
  } catch (error) {
    throw error;
  }
};

export const getAllTransactionsAdmin = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*, users(email, name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};
