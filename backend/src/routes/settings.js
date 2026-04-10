import express from 'express'
import SettingsControllers from '../controllers/settings.js'
import { requireAdmin } from '../middlewares/auth.js'

const settingsRouter = express.Router()
const settingsControllers = new SettingsControllers()

settingsRouter.get('/', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await settingsControllers.getSettings()
    return res.status(statusCode).send({ success, statusCode, body })
})

settingsRouter.put('/', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await settingsControllers.updateSettings(req.body)
    return res.status(statusCode).send({ success, statusCode, body })
})

export default settingsRouter
