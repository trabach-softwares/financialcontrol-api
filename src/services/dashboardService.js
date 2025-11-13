import { supabaseAdmin } from '../config/supabase.js';
import { getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth, getDateRangeFromPeriod } from '../utils/dateValidation.js';

export const dashboardService = {
  async getStats(userId, options = {}) {
    try {
      const { startDate, endDate } = options;

      // Define intervalo de datas
      let filterStartDate, filterEndDate;
      
      if (startDate || endDate) {
        // Se alguma data foi fornecida, usa ela
        filterStartDate = startDate || '1900-01-01'; // Data muito antiga se não fornecida
        filterEndDate = endDate || '2100-12-31'; // Data muito futura se não fornecida
      } else {
        // Se nenhuma data foi fornecida, usa mês atual
        filterStartDate = getFirstDayOfCurrentMonth();
        filterEndDate = getLastDayOfCurrentMonth();
      }

      // Get income and expense totals for the period
      const { data: periodStats } = await supabaseAdmin
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId)
        .gte('date', filterStartDate)
        .lte('date', filterEndDate);

      // Get all-time stats
      const { data: allTimeStats } = await supabaseAdmin
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId);

      // Calculate period totals
      const periodIncome = periodStats
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      const periodExpense = periodStats
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
        period: {
          startDate: filterStartDate,
          endDate: filterEndDate,
          income: periodIncome,
          expense: periodExpense,
          balance: periodIncome - periodExpense
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

  async getCharts(userId, options = {}) {
    try {
      const { period, startDate, endDate } = options;

      // Define intervalo de datas
      let filterStartDate, filterEndDate;
      
      if (startDate || endDate) {
        // Se datas foram fornecidas, usa elas
        filterStartDate = startDate || '1900-01-01';
        filterEndDate = endDate || '2100-12-31';
      } else if (period) {
        // Se período foi fornecido, calcula as datas
        const dateRange = getDateRangeFromPeriod(period);
        filterStartDate = dateRange.startDate;
        filterEndDate = dateRange.endDate;
      } else {
        // Padrão: últimos 6 meses
        const dateRange = getDateRangeFromPeriod('6months');
        filterStartDate = dateRange.startDate;
        filterEndDate = dateRange.endDate;
      }

      // Get transactions for the period
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('type, amount, date, category')
        .eq('user_id', userId)
        .gte('date', filterStartDate)
        .lte('date', filterEndDate)
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