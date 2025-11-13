import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { categoryController } from '../controllers/categoryController.js'
import { checkCategoryLimit } from '../middleware/planLimits.js'

const router = express.Router()

router.get('/', authenticateToken, categoryController.list)
router.post('/', authenticateToken, checkCategoryLimit, categoryController.create)
router.put('/:id', authenticateToken, categoryController.update)
router.delete('/:id', authenticateToken, categoryController.remove)

export default router
