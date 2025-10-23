import { supabaseAdmin } from '../config/supabase.js';

export const adminService = {
  async getAllUsers(filters = {}) {
    try {
      let query = supabaseAdmin
        .from('users')
        .select('id, email, name, role, plan_id, created_at');

      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.plan_id) {
        query = query.eq('plan_id', filters.plan_id);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getUserById(userId) {
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

  async updateUserRole(userId, role) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select('id, email, name, role, plan_id')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      // First delete user's transactions
      await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('user_id', userId);

      // Then delete user
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  },

  async getStats() {
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

      // Get users by plan
      const { data: usersByPlan, error: planError } = await supabaseAdmin
        .from('users')
        .select('plan_id');

      if (planError) throw planError;

      const planStats = {};
      usersByPlan.forEach(user => {
        const planId = user.plan_id || 'free';
        planStats[planId] = (planStats[planId] || 0) + 1;
      });

      return {
        totalUsers,
        totalTransactions,
        usersByPlan: planStats
      };
    } catch (error) {
      throw error;
    }
  }
};
