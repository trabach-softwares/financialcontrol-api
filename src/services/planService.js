import { supabaseAdmin } from '../config/supabase.js';

export const planService = {
  async getAll() {
    try {
      const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async getById(planId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async create(planData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('plans')
        .insert([
          {
            name: planData.name,
            description: planData.description,
            price: planData.price,
            features: planData.features,
            max_transactions: planData.max_transactions,
            is_active: planData.is_active !== undefined ? planData.is_active : true
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

  async update(planId, planData) {
    try {
      const updateData = {};
      
      if (planData.name) updateData.name = planData.name;
      if (planData.description) updateData.description = planData.description;
      if (planData.price !== undefined) updateData.price = planData.price;
      if (planData.features) updateData.features = planData.features;
      if (planData.max_transactions !== undefined) updateData.max_transactions = planData.max_transactions;
      if (planData.is_active !== undefined) updateData.is_active = planData.is_active;

      const { data, error } = await supabaseAdmin
        .from('plans')
        .update(updateData)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  async delete(planId) {
    try {
      const { error } = await supabaseAdmin
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  }
};
