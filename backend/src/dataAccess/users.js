import { Mongo } from "../database/mongo.js";
import { ObjectId } from "mongodb";
import crypto from 'crypto';

const collectionName = 'users'

/**
 * Classe que encapsula todas as operações diretas no banco de dados
 * relacionadas à coleção de usuários. Ela não sabe nada sobre HTTP ou
 * validação; recebe apenas parâmetros e retorna dados brutos.
 */
export default class UsersDataAccess {
    /**
     * Busca todos os documentos da coleção de usuários.
     *
     * @returns {Promise<Array>} array de usuários (cada um é um objeto perdido
     *                            do Mongo). Se não houver nenhum, retorna []
     */
    async getUsers() {
        const result = await Mongo.db
            .collection(collectionName)
            // retorna cursor para todos os documentos; poderia receber filtro
            .find({})
            // converte o cursor em array para manipulação mais fácil
            .toArray()

        return result
    }

    // método para eliminar um usuário pelo ID
    // retorna o documento excluído, ou null se não existir.
    async deleteUser(userId) {
        const result = await Mongo.db
            .collection(collectionName)
            .findOneAndDelete({ _id: new ObjectId(userId) })

        // alguns drivers devolvem o próprio documento; outros empacotam em
        // { value: doc }. Normalizamos para sempre retornar apenas o doc.
        return result && (result.value || result)
    }

    /**
 * Gera um código aleatório de 6 dígitos para reset/mudança de senha,
 * salva no banco com duração de 15 minutos e retorna o código.
 */
    async generateResetCode(userId) {
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
        const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        const result = await Mongo.db.collection(collectionName).findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: { resetCode, resetCodeExpires } },
            { returnDocument: 'after' }
        );

        if (!result || (!result.value && !result._id)) return null;
        const normalized = result.value || result;

        return {
            email: normalized.email,
            resetCode,
            name: normalized.name || 'Cliente'
        };
    }

    /**
     * Atualiza um usuário pelo ID. Se `userData` contiver uma nova senha,
     * ela exigirá `verificationCode` compatível com o do banco de dados.
     *
     * @param {string} userId - _id Mongo como string
     * @param {Object} userData - campos a alterar (pode incluir `password` e `verificationCode`)
     * @returns {Promise<Object|null>} documento atualizado
     */
    async updateUser(userId, userData) {
        // se veio senha, precisamos verificar o código primeiro
        if (userData.password) {
            if (!userData.verificationCode) {
                throw new Error('VERIFICATION_CODE_REQUIRED');
            }

            const currentUser = await Mongo.db.collection(collectionName).findOne({ _id: new ObjectId(userId) });
            if (!currentUser) throw new Error('USER_NOT_FOUND');

            if (!currentUser.resetCode || currentUser.resetCode !== userData.verificationCode) {
                throw new Error('INVALID_CODE');
            }

            if (!currentUser.resetCodeExpires || new Date() > currentUser.resetCodeExpires) {
                throw new Error('EXPIRED_CODE');
            }

            // Exclui o código das próximas manipulações para não sujar o DB
            delete userData.verificationCode;

            // Geramos salt e hash usando PBKDF2
            const salt = crypto.randomBytes(16);
            userData.password = await new Promise((resolve, reject) => {
                crypto.pbkdf2(userData.password, salt, 310000, 32, 'sha256', (err, derived) => {
                    if (err) return reject(err);
                    resolve(derived);
                });
            });
            userData.salt = salt;

            // Remove as informações de reset code do DB
            userData.resetCode = null;
            userData.resetCodeExpires = null;
        }

        const result = await Mongo.db
            .collection(collectionName)
            .findOneAndUpdate(
                { _id: new ObjectId(userId) },
                { $set: userData },
                { returnDocument: 'after' } // retorna o documento já alterado
            );
        // normalize similar a deleteUser
        return result && (result.value || result);
    }
} 