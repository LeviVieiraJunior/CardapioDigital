/**
 * Módulo de rotas para pratos (`orders`).
 *
 * As rotas aqui chamam métodos de `OrdersControllers` para executar as
 * operações de banco correspondentes. Cada rota recebe parâmetros/JSON da
 * requisição e transforma o retorno do controlador em resposta HTTP.
 *
 * Comentários JSDoc são usados ao longo do arquivo para ajudar na manutenção.
 */

import express from 'express'
import OrdersControllers from '../controllers/orders.js'
import { requireAuth, requireAdmin } from '../middlewares/auth.js'


// cria um roteador para operações com pratos
const ordersRouter = express.Router()

// controlador de pratos
const ordersControllers = new OrdersControllers()

/**
 * GET /orders
 *
 * Retorna a lista completa de pratos (orders).
 *
 * O fluxo é:
 * 1. Chamamos `ordersControllers.getOrders()`, que por sua vez usa
 *    `OrdersDataAccess.getOrders()` para buscar todos os documentos na coleção.
 * 2. O controlador devolve um objeto no formato `{ success, statusCode, body }`
 *    usando os helpers definidos em `helpers/httpResponse.js`.
 * 3. Aqui aplicamos `res.status(statusCode).send(...)`, enviando o objeto
 *    inteiro como corpo da resposta JSON.
 */
ordersRouter.get('/', requireAdmin, async (req, res) => {
    // o controlador unifica a resposta para nós
    const { success, statusCode, body } = await ordersControllers.getOrders()

    // `res.send` aceita um único argumento; devemos enviar o objeto inteiro
    // com os campos de resposta em vez de passar vários parâmetros.
    return res.status(statusCode).send({ success, statusCode, body })
})


/**
 * DELETE /orders/:id
 *
 * Exclui um prato pelo seu `_id`.
 *
 * O `id` vem nos parâmetros de rota (`req.params.id`). O controlador faz a
 * remoção no banco; se nada for encontrado retorna notFound.
 *
 * Exemplo de requisição:
 *   DELETE http://localhost:3000/orders/613a9f...
 */
ordersRouter.delete('/:id', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await ordersControllers.deleteOrder(req.params.id)
    return res.status(statusCode).send({ success, statusCode, body })
})

ordersRouter.post('/', requireAuth, async (req, res) => {
    const { success, statusCode, body } = await ordersControllers.addOrder(req.body)
    return res.status(statusCode).send({ success, statusCode, body })
})

ordersRouter.put('/:id', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await ordersControllers.updateOrder(req.params.id, req.body)
    
    return res.status(statusCode).send({ success, statusCode, body })
})

// exporta o roteador para ser usado em `index.js` com `app.use('/orders', ...)`
export default ordersRouter
