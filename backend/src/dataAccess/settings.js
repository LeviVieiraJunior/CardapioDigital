import { Mongo } from "../database/mongo.js";

const collectionName = 'settings';

export default class SettingsDataAccess {
    async getSettings() {
        const result = await Mongo.db.collection(collectionName).findOne({});
        return result || { cityDeliveryFee: 0, ruralDeliveryFee: 0 };
    }

    async updateSettings(settingsData) {
        const result = await Mongo.db.collection(collectionName).findOneAndUpdate(
            {},
            { $set: settingsData },
            { returnDocument: 'after', upsert: true }
        );
        return result && (result.value || result);
    }
}
