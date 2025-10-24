import { supabase } from '../config/supabase.js';

export const transactionService = {
  async create(userId, transactionData) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            type: transactionData.type,
            amount: transactionData.amount,
            description: transactionData.description,
            category: transactionData.category,
            date: transactionData.date || new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getAll(userId, filters = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getById(userId, transactionId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async update(userId, transactionId, transactionData) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          type: transactionData.type,
          amount: transactionData.amount,
          description: transactionData.description,
          category: transactionData.category,
          date: transactionData.date
        })
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async delete(userId, transactionId) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  },

  async getStats(userId) {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId);

      if (error) throw error;

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        income,
        expense,
        balance: income - expense,
        totalTransactions: transactions.length
      };
    } catch (error) {
      throw error;
    }
  }
};
