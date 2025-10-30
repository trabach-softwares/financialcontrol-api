import { supabaseAdmin } from '../config/supabase.js';

export const dashboardService = {
  async getStats(userId) {
    try {
      // Get current month stats
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Get income and expense totals for current month
      const { data: monthlyStats } = await supabaseAdmin
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId)
        .gte('date', firstDayOfMonth.toISOString())
        .lte('date', lastDayOfMonth.toISOString());

      // Get all-time stats
      const { data: allTimeStats } = await supabaseAdmin
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId);

      // Calculate monthly totals
      const monthlyIncome = monthlyStats
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      const monthlyExpense = monthlyStats
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      // Calculate all-time totals
      const totalIncome = allTimeStats
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      const totalExpense = allTimeStats
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      // Get transaction count
      const { count: totalTransactions } = await supabaseAdmin
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        monthly: {
          income: monthlyIncome,
          expense: monthlyExpense,
          balance: monthlyIncome - monthlyExpense
        },
        allTime: {
          income: totalIncome,
          expense: totalExpense,
          balance: totalIncome - totalExpense,
          totalTransactions: totalTransactions || 0
        }
      };
    } catch (error) {
      console.error('Error in dashboardService.getStats:', error);
      throw error;
    }
  },

  async getCharts(userId, period = '6months') {
    try {
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 6);
      }

      // Get transactions for the period
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('type, amount, date, category')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (!transactions || transactions.length === 0) {
        return {
          timeline: [],
          categories: {
            income: [],
            expense: []
          }
        };
      }

      // Group by month for timeline
      const monthlyData = {};
      transactions.forEach(transaction => {
        const month = new Date(transaction.date).toISOString().substr(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expense: 0 };
        }
        monthlyData[month][transaction.type] += parseFloat(transaction.amount);
      });

      const timeline = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense
      }));

      // Group by category
      const categoryData = { income: {}, expense: {} };
      transactions.forEach(transaction => {
        const { type, category, amount } = transaction;
        if (!categoryData[type][category]) {
          categoryData[type][category] = 0;
        }
        categoryData[type][category] += parseFloat(amount);
      });

      const categories = {
        income: Object.entries(categoryData.income).map(([name, value]) => ({ name, value })),
        expense: Object.entries(categoryData.expense).map(([name, value]) => ({ name, value }))
      };

      return {
        timeline,
        categories
      };
    } catch (error) {
      console.error('Error in dashboardService.getCharts:', error);
      throw error;
    }
  },

  async getRecent(userId, limit = 5) {
    try {
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return transactions || [];
    } catch (error) {
      console.error('Error in dashboardService.getRecent:', error);
      throw error;
    }
  }
};