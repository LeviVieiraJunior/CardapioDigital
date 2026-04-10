/**
 * Helper que representa resposta HTTP bem-sucedida (200).
 *
 * @param {*} body - corpo da resposta; pode ser objeto, array, string, etc.
 * @returns {{success: boolean, statusCode: number, body: *}}
 */
export const ok = (body) => {
    return {
        success: true,
        statusCode: 200,
        body
    }
}

/**
 * Helper para indicar recurso não encontrado ou requisição inválida.
 * Aqui usamos código 400 por simplicidade, mas poderia ser 404.
 *
 * @param {*} body (opcional) valor a incluir no corpo da resposta.
 * @returns {{success: boolean, statusCode: number, body: *}}
 */
export const notFound = (body) => {
    return {
        success: false,
        statusCode: 400,
        // preserva o texto passado ao chamar (ex: 'Usuário não encontrado')
        body: body || 'Not Found'
    }
} 

/**
 * Helper para erro de servidor.
 *
 * @param {*} error - objeto ou mensagem de erro capturado.
 * @returns {{success: boolean, statusCode: number, body: *}}
 */
export const serverError = (error) => {
    return {
        success: false,
        statusCode: 500,
        body: { text: error?.message || 'Erro interno do servidor.' }
    }
}

/**
 * Helper para requisição inválida (400 Bad Request).
 * Usado quando o cliente envia dados incorretos (ex: código de verificação errado).
 *
 * @param {string} message - mensagem explicando o erro.
 * @returns {{success: boolean, statusCode: number, body: *}}
 */
export const badRequest = (message) => {
    return {
        success: false,
        statusCode: 400,
        body: { text: message || 'Requisição inválida.' }
    }
}