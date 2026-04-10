import CategoriesDataAccess from '../dataAccess/categories.js'
import { ok, serverError, notFound } from '../helpers/httpResponse.js'

export default class CategoriesControllers {
    constructor() {
        this.dataAccess = new CategoriesDataAccess()
    }

    async getCategories() {
        try {
            const categories = await this.dataAccess.getCategories()
            return ok(categories)
        } catch (error) {
            return serverError(error)
        }
    }

    async addCategory(categoryData) {
        try {
            const result = await this.dataAccess.addCategory(categoryData)
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }

    async deleteCategory(categoryId) {
        try {
            const result = await this.dataAccess.deleteCategory(categoryId)
            if (!result) return notFound('Categoria não encontrada')
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }

    async updateCategory(categoryId, categoryData) {
        try {
            const result = await this.dataAccess.updateCategory(categoryId, categoryData)
            if (!result) return notFound('Categoria não encontrada')
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }
}
