import { Mongo } from "../database/mongo.js";
import { ObjectId } from "mongodb";

const collectionName = 'categories'

export default class CategoriesDataAccess {
    async getCategories() {
        const result = await Mongo.db
            .collection(collectionName)
            .find({})
            .toArray()
        return result
    }

    async addCategory(categoryData){
        const result = await Mongo.db
        .collection(collectionName)
        .insertOne(categoryData)
        return result
    }

    async deleteCategory(categoryId) {
        const result = await Mongo.db
            .collection(collectionName)
            .findOneAndDelete({ _id: new ObjectId(categoryId) })
        return result && (result.value || result)
    }

    async updateCategory(categoryId, categoryData) {
        const result = await Mongo.db
            .collection(collectionName)
            .findOneAndUpdate(
                { _id: new ObjectId(categoryId) },
                { $set: categoryData },
                { returnDocument: 'after' }
            );
        return result && (result.value || result);
    }
}
