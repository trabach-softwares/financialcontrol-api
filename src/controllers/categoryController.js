import { categoriesService } from '../services/categoriesService.js'
import { sendSuccess, sendError } from '../utils/response.js'

export const categoryController = {
  async list(req, res) {
    try {
      const userId = req.user.id
      const categories = await categoriesService.list(userId)
      return sendSuccess(res, categories, 'Categories fetched')
    } catch (error) {
      return sendError(res, error.message || 'Failed to fetch categories', 400)
    }
  },

  async create(req, res) {
    try {
      const userId = req.user.id
      const { name, icon, color, type } = req.body
      const category = await categoriesService.create(userId, name, icon, color, type)
      return sendSuccess(res, category, 'Category created', 201)
    } catch (error) {
      return sendError(res, error.message || 'Failed to create category', 400)
    }
  }
  ,

  async update(req, res) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { name, icon, color } = req.body
      const category = await categoriesService.update(userId, id, { name, icon, color })
      return sendSuccess(res, category, 'Category updated')
    } catch (error) {
      return sendError(res, error.message || 'Failed to update category', 400)
    }
  },

  async remove(req, res) {
    try {
      const userId = req.user.id
      const { id } = req.params
      await categoriesService.remove(userId, id)
      return sendSuccess(res, true, 'Category deleted')
    } catch (error) {
      return sendError(res, error.message || 'Failed to delete category', 400)
    }
  }
}
