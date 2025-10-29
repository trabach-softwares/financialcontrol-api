import { supabaseAdmin } from '../config/supabase.js';
import { accountService } from './accountService.js';
import { generateAccountStatementReport } from './reportService.js';

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const sanitizeTransaction = (row = {}) => ({
  id: row.id,
  userId: row.user_id,
  accountId: row.account_id,
  type: row.type,
  amount: toNumber(row.amount, 0),
  description: row.description || null,
  category: row.category || null,
  date: row.date,
  paid: Boolean(row.paid),
  paidAt: row.paid_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeDateParam = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

const applyStatementFilters = (query, filters = {}) => {
  const { type, category, startDate, endDate, search } = filters;

  if (type) {
    query = query.eq('type', type);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  if (search) {
    query = query.ilike('description', `%${search}%`);
  }

  return query;
};

const sumTransactions = (rows = [], targetType) =>
  rows.reduce((total, row) => {
    if (row.type === targetType) {
      total += toNumber(row.amount, 0);
    }
    return total;
  }, 0);

export const transactionService = {
  async create(userId, transactionData) {
    try {
      const normalizeDate = (d) => (d ? String(d).slice(0, 10) : new Date().toISOString().slice(0,10))
      const normalizePaidAt = (d) => (d ? String(d).slice(0, 10) : new Date().toISOString().slice(0,10))

      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert([
          {
            user_id: userId,
            type: transactionData.type,
            amount: transactionData.amount,
            description: transactionData.description,
            category: transactionData.category,
            account_id: transactionData.accountId || null,
            date: normalizeDate(transactionData.date),
            paid: transactionData.paid === true,
            paid_at: transactionData.paid === true
              ? normalizePaidAt(transactionData.paidAt)
              : null
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

  async createBulk(userId, transactionsArray = []) {
    try {
      const normalizeDate = (d) => (d ? String(d).slice(0, 10) : new Date().toISOString().slice(0,10))
      const normalizePaidAt = (d) => (d ? String(d).slice(0, 10) : new Date().toISOString().slice(0,10))

      const payload = (transactionsArray || []).map((t) => ({
        user_id: userId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        account_id: t.accountId || null,
        date: normalizeDate(t.date),
        paid: t.paid === true,
        paid_at: t.paid === true ? normalizePaidAt(t.paidAt) : null,
        series_id: t.seriesId || null,
        installment_number: t.installmentNumber || null,
        installment_total: t.installmentTotal || null,
      }))

      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert(payload)
        .select()

      if (error) throw error
      return data
    } catch (error) {
      throw error
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

      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }

      if (typeof filters.paid === 'boolean') {
        query = query.eq('paid', filters.paid);
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
      const { data, error } = await supabaseAdmin
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
      // Monta payload dinamicamente
      const normalizeDate = (d) => (d ? String(d).slice(0, 10) : undefined)
      const normalizePaidAt = (d) => (d ? String(d).slice(0, 10) : undefined)

      const updatePayload = {
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        category: transactionData.category,
        ...(transactionData.date ? { date: normalizeDate(transactionData.date) } : {}),
      }

      if (typeof transactionData.paid === 'boolean') {
        updatePayload.paid = transactionData.paid
        updatePayload.paid_at = transactionData.paid
          ? (normalizePaidAt(transactionData.paidAt) || new Date().toISOString().slice(0,10))
          : null
      } else if (transactionData.paidAt) {
        // caso apenas a data seja enviada, mantém paid como true
        updatePayload.paid_at = normalizePaidAt(transactionData.paidAt)
      }

      const { data, error } = await supabaseAdmin
        .from('transactions')
        .update(updatePayload)
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
      const { error } = await supabaseAdmin
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

  async getStats(userId, { startDate, endDate } = {}) {
    try {
      let query = supabaseAdmin
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', userId);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data: transactions, error } = await query;
      if (error) throw error;

      const income = (transactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expense = (transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        income,
        expense,
        balance: income - expense,
        totalTransactions: (transactions || []).length
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

      const { data: transactions, error } = await supabaseAdmin
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
  },

  async deleteSeriesForward(userId, seriesId, fromDate) {
    try {
      if (!seriesId) {
        throw new Error('seriesId is required')
      }
      const normalizeDate = (d) => (d ? String(d).slice(0, 10) : null)

      let query = supabaseAdmin
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('series_id', seriesId)

      const d = normalizeDate(fromDate)
      if (d) {
        query = query.gte('date', d)
      }

      // Return deleted rows to compute count
      const { data, error } = await query.select()
      if (error) throw error
      return Array.isArray(data) ? data.length : 0
    } catch (error) {
      throw error
    }
  }
};
