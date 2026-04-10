import { Mongo } from "../database/mongo.js";
import { ObjectId } from "mongodb";

const collectionName = 'plates'

/**
 * Classe que encapsula todas as operações diretas no banco de dados
 * relacionadas à coleção de pratos. Ela não sabe nada sobre HTTP ou
 * validação; recebe apenas parâmetros e retorna dados brutos.
 */
export default class PlatesDataAccess {
    /**
     * Busca todos os documentos da coleção de pratos.
     *
     * @returns {Promise<Array>} array de pratos (cada um é um objeto do
     *                            Mongo). Se não houver nenhum, retorna []
     */
    async getPlates() {
        const result = await Mongo.db
            .collection(collectionName)
            // retorna cursor para todos os documentos; poderia receber filtro
            .find({})
            // converte o cursor em array para manipulação mais fácil
            .toArray()

        return result
    }

    async getAvailablePlates() {
        const result = await Mongo.db
            .collection(collectionName)
            // retorna cursor para todos os documentos; poderia receber filtro
            .find({ available: true })
            // converte o cursor em array para manipulação mais fácil
            .toArray()

        return result
    }

    async addPlate(plateData){
        const result = await Mongo.db
        .collection(collectionName)
        .insertOne(plateData)

        return result
    }
    // método para eliminar um usuário pelo ID
    // retorna o documento excluído, ou null se não existir.
    async deletePlate(plateId) {
        const result = await Mongo.db
            .collection(collectionName)
            .findOneAndDelete({ _id: new ObjectId(plateId) })

        // alguns drivers devolvem o próprio documento; outros empacotam em
        // { value: doc }. Normalizamos para sempre retornar apenas o doc.
        return result && (result.value || result)
    }

        /**
     * Atualiza um usuário pelo ID. Se `userData` contiver uma nova senha,
     * ela será re-hashada com salt antes de gravar no banco.
     *
     * @param {string} userId - _id Mongo como string
     * @param {Object} userData - campos a alterar (pode incluir `password`)
     * @returns {Promise<Object|null>} documento atualizado ou null se não
     *                                  existir
     */
    async updatePlate(plateId, plateData) {
        // se veio senha, precisamos aplicar o mesmo processo de criptografia
        const result = await Mongo.db
            .collection(collectionName)
            .findOneAndUpdate(
                { _id: new ObjectId(plateId) },
                { $set: plateData },
                { returnDocument: 'after' } // retorna o documento já alterado
            );
        // normalize similar a deleteUser
        return result && (result.value || result);
    }
} 