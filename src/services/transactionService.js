import { supabaseAdmin } from '../config/supabase.js';

export const createTransaction = async (userId, transactionData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert([
        {
          user_id: userId,
          ...transactionData,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export const getTransactions = async (userId, filters = {}) => {
  try {
    let query = supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply filters
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

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export const getTransactionById = async (userId, transactionId) => {
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
};

export const updateTransaction = async (userId, transactionId, updates) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteTransaction = async (userId, transactionId) => {
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
};

export const getTransactionsSummary = async (userId) => {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId);

    if (error) throw error;

    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.totalIncome += parseFloat(transaction.amount);
        } else if (transaction.type === 'expense') {
          acc.totalExpense += parseFloat(transaction.amount);
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    summary.balance = summary.totalIncome - summary.totalExpense;

    return summary;
  } catch (error) {
    throw error;
  }
};
