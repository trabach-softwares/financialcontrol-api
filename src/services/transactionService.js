import { supabaseAdmin } from '../config/supabase.js';

export const transactionService = {
  async create(userId, transactionData) {
    try {
      const { data, error } = await supabaseAdmin
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
      console.error('[transactionService.create] userId', userId, 'payload', transactionData, 'error', error?.message, error)
      throw error;
    }
  },

  async getAll(userId, filters = {}) {
    try {
      let query = supabaseAdmin
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

      // Ordenação
      if (filters.sort) {
        const [field, direction] = filters.sort.split(':');
        query = query.order(field, { ascending: direction !== 'desc' });
      } else {
        query = query.order('date', { ascending: false });
      }

      // Paginação
      if (filters.page && filters.limit) {
        const offset = (filters.page - 1) * filters.limit;
        const end = offset + filters.limit - 1;
        query = query.range(offset, end);
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

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
  },

  async getTimeline(userId, period = '6months') {
    try {
      // Calcular data de início baseada no período
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case '1month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 6);
      }

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, type, amount')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      // Agrupar por mês
      const monthlyData = {};

      transactions.forEach(t => {
        const month = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM

        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expense: 0 };
        }

        if (t.type === 'income') {
          monthlyData[month].income += parseFloat(t.amount);
        } else {
          monthlyData[month].expense += parseFloat(t.amount);
        }
      });

      // Converter para array ordenado
      const timeline = Object.keys(monthlyData)
        .sort()
        .map(month => ({
          month,
          income: monthlyData[month].income,
          expense: monthlyData[month].expense,
          balance: monthlyData[month].income - monthlyData[month].expense
        }));

      return timeline;
    } catch (error) {
      throw error;
    }
  }
};
