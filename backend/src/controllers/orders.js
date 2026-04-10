import OrdersDataAccess from '../dataAccess/orders.js'
import CashRegistersDataAccess from '../dataAccess/cashRegisters.js'
import { ok, notFound, serverError, badRequest } from '../helpers/httpResponse.js'

/**
 * ============================================================================
 * CONTROLLER: orders.js
 * ============================================================================
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Gerencia o fluxo de pedidos (orders) desde a criação até a entrega.
 * 2. `addOrder`: Salva o pedido feito pelo cliente no checkout.
 * 3. `getOrders`: O Admin usa para listar todos os pedidos no Kanban.
 * 4. `updateOrder`: Usado para mudar status (Recebido -> Preparo -> etc.)
 *    e para confirmar pagamentos de PIX/Cartão.
 * ============================================================================
 */
export default class OrdersControllers {
    constructor() {
        // camada de acesso a dados para restaurantes/pratos
        this.dataAccess = new OrdersDataAccess()
        this.cashRegistersDataAccess = new CashRegistersDataAccess()
    }

    /**
     * Recupera todos os pedidos do banco.
     *
     * @returns {Promise<{success:boolean,statusCode:number,body:*}>} objeto de resposta
     */
    async getOrders() {
        try {
            const orders = await this.dataAccess.getOrders()
            // transforma resultado em resposta padronizada
            return ok(orders)
        } catch (error) {
            return serverError(error)
        }
    }

     async getAvailableOrders() {
        try {
            const orders = await this.dataAccess.getAvailableOrders()
            // transforma resultado em resposta padronizada
            return ok(orders)
        } catch (error) {
            return serverError(error)
        }
    }

       async deleteOrder(orderId) {
        try {
            const result = await this.dataAccess.deleteOrder(orderId)
            if (!result) {
                return notFound('Prato não encontrado')
            }
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }

        async addOrder(orderData) {
        try {
            // Verifica se a loja está aberta antes de aceitar o pedido
            const activeRegister = await this.cashRegistersDataAccess.getActiveRegister()
            if (!activeRegister) {
                return badRequest('O estabelecimento está fechado no momento. Não é possível aceitar novos pedidos.')
            }

            // Opcional: Adicionar o ID do caixa dentro do pedido para referência futura e consultas mais rápidas
            orderData.cashRegisterId = activeRegister._id.toString()

            const result = await this.dataAccess.addOrder(orderData)
            if (!result) {
                return serverError('Falha ao adicionar pedido')
            }
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }   

        async updateOrder(orderId, orderData) {
        try {
            const result = await this.dataAccess.updateOrder(orderId, orderData)

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