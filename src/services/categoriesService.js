import { supabaseAdmin } from '../config/supabase.js'
import { planLimitsService } from './planLimitsService.js'

export const categoriesService = {
  _normalizeColor(input) {
    const map = {
      'blue-6': '#1E88E5',
      'indigo-6': '#3949AB',
      'teal-6': '#00897B',
      'green-6': '#43A047',
      'amber-6': '#FFB300',
      'deep-orange-6': '#F4511E',
      'red-6': '#E53935',
      'pink-6': '#D81B60',
      'purple-6': '#8E24AA',
      'cyan-6': '#00ACC1',
      'grey-7': '#616161'
    }
    if (!input) return '#607D8B'
    const val = String(input).trim()
    if (/^#([0-9A-Fa-f]{6})$/.test(val)) return val
    if (map[val]) return map[val]
    return '#607D8B'
  },
  async list(userId) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, icon, color, created_at, type, is_default, user_id')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .order('is_default', { ascending: true })
      .order('name', { ascending: true })
    if (error) throw error
    return data?.map(({ id, name, icon, color, created_at, type, is_default }) => ({ id, name, icon, color, created_at, type, is_default }))
  },

  async create(userId, name, icon = 'category', color = 'blue-6', type = 'expense') {
    const trimmed = (name || '').trim()
    if (!trimmed) throw new Error('Category name is required')
    const catType = (type === 'income' || type === 'expense') ? type : 'expense'

    // Verifica limite do plano antes de criar
    const limitCheck = await planLimitsService.canCreateCategory(userId)
    if (!limitCheck.allowed) {
      const error = new Error(
        `Limite de categorias atingido. Você tem ${limitCheck.current} de ${limitCheck.limit} categorias personalizadas no plano ${limitCheck.planName}. Faça upgrade para criar mais categorias!`
      )
      error.status = 403
      error.data = {
        current: limitCheck.current,
        limit: limitCheck.limit,
        planName: limitCheck.planName,
        upgradeRequired: true
      }
      throw error
    }

    // ensure unique per user AND type (allow same name for income/expense)
    const { data: exists } = await supabaseAdmin
      .from('categories')
      .select('id, name, icon, color, created_at, type, is_default')
      .eq('user_id', userId)
      .eq('type', catType)
      .ilike('name', trimmed)
      .maybeSingle()

    if (exists) return exists

    const hexColor = this._normalizeColor(color)
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ user_id: userId, name: trimmed, icon, color: hexColor, type: catType, is_default: false }])
      .select('id, name, icon, color, created_at, type, is_default')
      .single()
    if (error) throw error
    return data
  },

  async update(userId, id, payload) {
    const updateData = {}
    if (payload.name) updateData.name = payload.name.trim()
    if (payload.icon) updateData.icon = payload.icon
    if (payload.color) updateData.color = this._normalizeColor(payload.color)
    if (payload.type && (payload.type === 'income' || payload.type === 'expense')) {
      updateData.type = payload.type
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // garante que só atualiza do usuário
      .select('id, name, icon, color, created_at, type, is_default')
      .single()
    if (error) throw error
    return data
  },

  async remove(userId, id) {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    return true
  }
}
