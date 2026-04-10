// O módulo `mongo.js` encapsula a lógica de conexão com o MongoDB.
// Ele exporta um objeto `Mongo` com duas propriedades que serão preenchidas
// após a primeira chamada a `connect`: `client` (instância do MongoClient) e
// `db` (referência ao banco de dados selecionado).
//
// O resto da aplicação importa `Mongo` para executar operações de banco
// (por exemplo, `Mongo.db.collection('users').find(...`) sem precisar criar
// repetidamente uma nova conexão.

import { MongoClient } from 'mongodb'

export const Mongo = {

    /**
     * Estabelece conexão com o servidor MongoDB.
     *
     * @param {Object} opts
     * @param {string} opts.mongoConnectionString - URI de conexão (ex: mongodb://…)
     * @param {string} opts.mongoDbName - Nome do banco de dados a ser usado
     * @returns {Promise<string|Object>} Mensagem de sucesso ou objeto de erro
     */
    async connect({ mongoConnectionString, mongoDbName }) {
        try {
            // cria o cliente e conecta ao servidor
            const client = new MongoClient(mongoConnectionString)

            await client.connect()

            // escolhe o database dentro do servidor
            const db = client.db(mongoDbName)

            // armazena para uso global
            this.client = client
            this.db = db

            return 'Conectado com Mongo!'
        } catch (error) {
            return { text: 'Erro durante a conexão com mongo', error }
        }
    }
} 
