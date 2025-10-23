import { supabaseAdmin } from '../config/supabase.js';

export const getAllPlans = async () => {
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
};

export const getPlanById = async (planId) => {
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
};

export const createPlan = async (planData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .insert([planData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export const updatePlan = async (planId, updates) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export const deletePlan = async (planId) => {
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
};

export const subscribeToPlan = async (userId, planId) => {
  try {
    // Update user's plan
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ plan_id: planId })
      .eq('id', userId)
      .select('id, email, name, role, plan_id, created_at')
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};
