import SettingsDataAccess from "../dataAccess/settings.js";
import { ok, serverError } from '../helpers/httpResponse.js'

export default class SettingsControllers {
    constructor() {
        this.dataAccess = new SettingsDataAccess()
    }

    async getSettings() {
        try {
            const settings = await this.dataAccess.getSettings()
            return ok(settings)
        } catch (error) {
            return serverError(error)
        }
    }

    async updateSettings(settingsData) {
        try {
            const result = await this.dataAccess.updateSettings(settingsData)
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }
}
