import express from 'express'
import CategoriesControllers from '../controllers/categories.js'
import { requireAdmin } from '../middlewares/auth.js'

const categoriesRouter = express.Router()
const categoriesControllers = new CategoriesControllers()

categoriesRouter.get('/', async (req, res) => {
    const { success, statusCode, body } = await categoriesControllers.getCategories()
    return res.status(statusCode).send({ success, statusCode, body })
})

categoriesRouter.post('/', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await categoriesControllers.addCategory(req.body)
    return res.status(statusCode).send({ success, statusCode, body })
})

categoriesRouter.delete('/:id', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await categoriesControllers.deleteCategory(req.params.id)
    return res.status(statusCode).send({ success, statusCode, body })
})

categoriesRouter.put('/:id', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await categoriesControllers.updateCategory(req.params.id, req.body)
    return res.status(statusCode).send({ success, statusCode, body })
})

export default categoriesRouter
