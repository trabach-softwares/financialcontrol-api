import { supabaseAdmin } from '../config/supabase.js';

const ACCOUNT_TYPES = ['checking', 'savings', 'investment', 'digital'];
const ACCOUNT_STATUSES = ['active', 'archived'];

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const sanitizeAccount = (row = {}) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    bankName: row.bank_name,
    bankCode: row.bank_code,
    branch: row.branch,
    accountNumber: row.account_number,
    accountType: row.account_type,
    currency: row.currency,
    openingBalance: row.opening_balance !== undefined && row.opening_balance !== null
      ? Number(row.opening_balance)
      : 0,
    currentBalance: row.current_balance !== undefined && row.current_balance !== null
      ? Number(row.current_balance)
      : 0,
    creditLimit: row.credit_limit !== undefined && row.credit_limit !== null
      ? Number(row.credit_limit)
      : 0,
    status: row.status,
    icon: row.icon,
    color: row.color,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const buildInsertPayload = (userId, payload = {}) => {
  const data = {
    user_id: userId,
    name: payload.name?.trim(),
    bank_name: payload.bankName?.trim() || null,
    bank_code: payload.bankCode?.trim() || null,
    branch: payload.branch?.trim() || null,
    account_number: payload.accountNumber?.trim() || null,
    account_type: ACCOUNT_TYPES.includes(payload.accountType) ? payload.accountType : 'checking',
    currency: (payload.currency || 'BRL').trim(),
    opening_balance: toNumber(payload.openingBalance, 0),
    current_balance: payload.currentBalance !== undefined && payload.currentBalance !== null
      ? toNumber(payload.currentBalance, 0)
      : toNumber(payload.openingBalance, 0),
    credit_limit: toNumber(payload.creditLimit, 0),
    status: ACCOUNT_STATUSES.includes(payload.status) ? payload.status : 'active',
    icon: payload.icon?.trim() || null,
    color: payload.color?.trim() || null,
    notes: payload.notes?.trim() || null
  };

  return data;
};

const buildUpdatePayload = (payload = {}) => {
  const updateData = {};

  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.bankName !== undefined) updateData.bank_name = payload.bankName?.trim() || null;
  if (payload.bankCode !== undefined) updateData.bank_code = payload.bankCode?.trim() || null;
  if (payload.branch !== undefined) updateData.branch = payload.branch?.trim() || null;
  if (payload.accountNumber !== undefined) updateData.account_number = payload.accountNumber?.trim() || null;

  if (payload.accountType !== undefined && ACCOUNT_TYPES.includes(payload.accountType)) {
    updateData.account_type = payload.accountType;
  }

  if (payload.currency !== undefined) {
    updateData.currency = payload.currency.trim();
  }

  if (payload.openingBalance !== undefined) {
    updateData.opening_balance = toNumber(payload.openingBalance, 0);
  }

  if (payload.currentBalance !== undefined) {
    updateData.current_balance = toNumber(payload.currentBalance, 0);
  }

  if (payload.creditLimit !== undefined) {
    updateData.credit_limit = toNumber(payload.creditLimit, 0);
  }

  if (payload.status !== undefined && ACCOUNT_STATUSES.includes(payload.status)) {
    updateData.status = payload.status;
  }

  if (payload.icon !== undefined) {
    updateData.icon = payload.icon?.trim() || null;
  }

  if (payload.color !== undefined) {
    updateData.color = payload.color?.trim() || null;
  }

  if (payload.notes !== undefined) {
    updateData.notes = payload.notes?.trim() || null;
  }

  return updateData;
};

export const accountService = {
  async create(userId, payload) {
    try {
      const insertPayload = buildInsertPayload(userId, payload);
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;
      return sanitizeAccount(data);
    } catch (error) {
      console.error('[accountService.create] user', userId, 'error', error?.message);
      throw error;
    }
  },

  async list(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(sanitizeAccount);
    } catch (error) {
      console.error('[accountService.list] user', userId, 'error', error?.message);
      throw error;
    }
  },

  async getById(userId, accountId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return sanitizeAccount(data);
    } catch (error) {
      console.error('[accountService.getById] user', userId, 'account', accountId, 'error', error?.message);
      throw error;
    }
  },

  async update(userId, accountId, payload) {
    try {
      const updateData = buildUpdatePayload(payload);

      if (Object.keys(updateData).length === 0) {
        return this.getById(userId, accountId);
      }

      const { data, error } = await supabaseAdmin
        .from('accounts')
        .update(updateData)
        .eq('id', accountId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return sanitizeAccount(data);
    } catch (error) {
      console.error('[accountService.update] user', userId, 'account', accountId, 'error', error?.message);
      throw error;
    }
  },

  async archive(userId, accountId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .update({ status: 'archived' })
        .eq('id', accountId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return sanitizeAccount(data);
    } catch (error) {
      console.error('[accountService.archive] user', userId, 'account', accountId, 'error', error?.message);
      throw error;
    }
  },

  async delete(userId, accountId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      console.error('[accountService.delete] user', userId, 'account', accountId, 'error', error?.message);
      throw error;
    }
  },

  async getSummary(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('accounts')
        .select('status, currency, opening_balance, current_balance, credit_limit')
        .eq('user_id', userId);

      if (error) throw error;

      const rows = data || [];
      const totalAccounts = rows.length;
      const activeAccounts = rows.filter((row) => row.status === 'active').length;
      const archivedAccounts = rows.filter((row) => row.status === 'archived').length;

      let totalOpening = 0;
      let totalCurrent = 0;
      let totalCredit = 0;
      const currencyBreakdown = {};

      rows.forEach((row) => {
        const opening = toNumber(row.opening_balance, 0);
        const current = toNumber(row.current_balance, 0);
        const credit = toNumber(row.credit_limit, 0);
        const currency = row.currency || 'BRL';

        totalOpening += opening;
        totalCurrent += current;
        totalCredit += credit;

        if (!currencyBreakdown[currency]) {
          currencyBreakdown[currency] = {
            totalOpening: 0,
            totalCurrent: 0,
            totalCreditLimit: 0,
            accounts: 0
          };
        }

        currencyBreakdown[currency].totalOpening += opening;
        currencyBreakdown[currency].totalCurrent += current;
        currencyBreakdown[currency].totalCreditLimit += credit;
        currencyBreakdown[currency].accounts += 1;
      });

      return {
        totalAccounts,
        activeAccounts,
        archivedAccounts,
        totals: {
          openingBalance: totalOpening,
          currentBalance: totalCurrent,
          creditLimit: totalCredit
        },
        currencyBreakdown
      };
    } catch (error) {
      console.error('[accountService.getSummary] user', userId, 'error', error?.message);
      throw error;
    }
  }
};
