/**
 * Módulo de rotas para usuários
 *
 * As rotas definidas aqui delegam o trabalho ao controlador de usuários
 * (`UsersControllers`). Cada rota extrai os dados da requisição (por exemplo,
 * parâmetros de URL, corpo JSON) e transforma o resultado do controlador em uma
 * resposta HTTP padronizada.
 *
 * A documentação abaixo foi escrita usando o estilo JSDoc para que futuros
 * mantenedores (como você!) entendam facilmente o propósito de cada peça.
 */

import express from 'express'
import UsersControllers from '../controllers/users.js'
import { requireAuth, requireAdmin } from '../middlewares/auth.js'

// cria um roteador cheio de métodos (get/post/put/delete) usado pelo Express
const usersRouter = express.Router()

// instância do controlador responsável pela lógica de negócios de usuário
const usersControllers = new UsersControllers()

/**
 * GET /users
 *
 * Retorna a lista completa de usuários.
 *
 * O fluxo é:
 * 1. Chamamos `usersControllers.getUsers()`, que por sua vez usa
 *    `UsersDataAccess.getUsers()` para buscar todos os documentos na coleção.
 * 2. O controlador devolve um objeto no formato `{ success, statusCode, body }`
 *    usando os helpers definidos em `helpers/httpResponse.js`.
 * 3. Aqui aplicamos `res.status(statusCode).send(...)`, enviando o objeto
 *    inteiro como corpo da resposta JSON.
 *
 * Exemplos de retorno:
 * ```json
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "body": [ { "_id": "...", "email": "..." }, ... ]
 * }
 * ```
 */
usersRouter.get('/', requireAdmin, async (req, res) => {
    // o controlador unifica a resposta para nós
    const { success, statusCode, body } = await usersControllers.getUsers()

    // `res.send` aceita um único argumento; devemos enviar o objeto inteiro
    // com os campos de resposta em vez de passar vários parâmetros.
    return res.status(statusCode).send({ success, statusCode, body })
})

/**
 * DELETE /users/:id
 *
 * Exclui um usuário pelo seu `_id`.
 *
 * O `id` vem nos parâmetros de rota (`req.params.id`). A função do
 * controlador executa a remoção no banco e devolve uma estrutura padrão.
 * Se nenhum usuário existir com o id fornecido, retorna um 400 (notFound).
 *
 * Exemplo de requisição no Thunder Client:
 *   DELETE http://localhost:3000/users/613a9f...
 */
usersRouter.delete('/:id', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await usersControllers.deleteUser(req.params.id)
    return res.status(statusCode).send({ success, statusCode, body })
})

/**
 * POST /users/:id/send-code
 * Envia um e-mail com código de verificação para o usuário (usado na alteração de senha)
 */
usersRouter.post('/:id/send-code', requireAuth, async (req, res) => {
    const { success, statusCode, body } = await usersControllers.sendVerificationCode(req.params.id)
    return res.status(statusCode).send({ success, statusCode, body })
})

usersRouter.put('/:id', requireAuth, async (req, res) => {
    const { success, statusCode, body } = await usersControllers.updateUser(req.params.id, req.body)
    
    return res.status(statusCode).send({ success, statusCode, body })
})

// exporta o roteador para ser usado em `index.js` com `app.use('/users', ...)`
export default usersRouter
