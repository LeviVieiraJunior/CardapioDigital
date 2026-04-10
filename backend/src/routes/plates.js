/**
 * Módulo de rotas para pratos (`plates`).
 *
 * As rotas aqui chamam métodos de `PlatesControllers` para executar as
 * operações de banco correspondentes. Cada rota recebe parâmetros/JSON da
 * requisição e transforma o retorno do controlador em resposta HTTP.
 *
 * Comentários JSDoc são usados ao longo do arquivo para ajudar na manutenção.
 */

import express from 'express'
import PlatesControllers from '../controllers/plates.js'
import { requireAdmin } from '../middlewares/auth.js'

// cria um roteador para operações com pratos
const platesRouter = express.Router()

// controlador de pratos
const platesControllers = new PlatesControllers()

/**
 * GET /plates
 *
 * Retorna a lista completa de pratos (plates).
 *
 * O fluxo é:
 * 1. Chamamos `platesControllers.getPlates()`, que por sua vez usa
 *    `PlatesDataAccess.getPlates()` para buscar todos os documentos na coleção.
 * 2. O controlador devolve um objeto no formato `{ success, statusCode, body }`
 *    usando os helpers definidos em `helpers/httpResponse.js`.
 * 3. Aqui aplicamos `res.status(statusCode).send(...)`, enviando o objeto
 *    inteiro como corpo da resposta JSON.
 */
platesRouter.get('/', async (req, res) => {
    // o controlador unifica a resposta para nós
    const { success, statusCode, body } = await platesControllers.getPlates()

    // `res.send` aceita um único argumento; devemos enviar o objeto inteiro
    // com os campos de resposta em vez de passar vários parâmetros.
    return res.status(statusCode).send({ success, statusCode, body })
})

platesRouter.get('/availables/', async (req, res) => {
    // o controlador unifica a resposta para nós
    const { success, statusCode, body } = await platesControllers.getAvailablePlates()

    // `res.send` aceita um único argumento; devemos enviar o objeto inteiro
    // com os campos de resposta em vez de passar vários parâmetros.
    return res.status(statusCode).send({ success, statusCode, body })
})

/**
 * DELETE /plates/:id
 *
 * Exclui um prato pelo seu `_id`.
 *
 * O `id` vem nos parâmetros de rota (`req.params.id`). O controlador faz a
 * remoção no banco; se nada for encontrado retorna notFound.
 *
 * Exemplo de requisição:
 *   DELETE http://localhost:3000/plates/613a9f...
 */
platesRouter.delete('/:id', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await platesControllers.deletePlate(req.params.id)
    return res.status(statusCode).send({ success, statusCode, body })
})

platesRouter.post('/', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await platesControllers.addPlate(req.body)
    return res.status(statusCode).send({ success, statusCode, body })
})

platesRouter.put('/:id', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await platesControllers.updatePlate(req.params.id, req.body)
    
    return res.status(statusCode).send({ success, statusCode, body })
})

// exporta o roteador para ser usado em `index.js` com `app.use('/plates', ...)`
export default platesRouter
