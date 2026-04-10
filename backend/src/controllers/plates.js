
import PlatesDataAccess from '../dataAccess/plates.js'
import { ok, notFound, serverError } from '../helpers/httpResponse.js'

/**
 * ============================================================================
 * CONTROLLER: plates.js
 * ============================================================================
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Gerencia os produtos (pratos) do sistema.
 * 2. Recebe as requisições HTTP do Frontend e chama o `PlatesDataAccess`.
 * 3. `getAvailablePlates`: Usado pelo cliente para ver o que tem pra comprar.
 * 4. `updatePlate`: Usado no Admin para editar nome, preço e a Flag de Promoção.
 * ============================================================================
 */
export default class PlatesControllers {
    constructor() {
        // camada de acesso a dados para restaurantes/pratos
        this.dataAccess = new PlatesDataAccess()
    }

    /**
     * Recupera todos os pratos do banco.
     *
     * @returns {Promise<{success:boolean,statusCode:number,body:*}>} objeto de resposta
     */
    async getPlates() {
        try {
            const plates = await this.dataAccess.getPlates()
            // transforma resultado em resposta padronizada
            return ok(plates)
        } catch (error) {
            return serverError(error)
        }
    }

     async getAvailablePlates() {
        try {
            const plates = await this.dataAccess.getAvailablePlates()
            // transforma resultado em resposta padronizada
            return ok(plates)
        } catch (error) {
            return serverError(error)
        }
    }

       async deletePlate(plateId) {
        try {
            const result = await this.dataAccess.deletePlate(plateId)
            if (!result) {
                return notFound('Prato não encontrado')
            }
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }

        async addPlate(plateData) {
        try {
            const result = await this.dataAccess.addPlate(plateData)
            if (!result) {
                return serverError('Falha ao adicionar prato')
            }
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }   

        async updatePlate(plateId, plateData) {
        try {
            const result = await this.dataAccess.updatePlate(plateId, plateData)

            if (!result) {
                return notFound('Prato não encontrado')
            }
            
            // não existem campos sensíveis em um prato; apenas retornamos o objeto
            return ok(result)

        } catch (error) {
            return serverError(error)
        }
    }
} 