import UsersDataAccess from "../dataAccess/users.js";
import { ok, notFound, serverError, badRequest } from '../helpers/httpResponse.js'
import { sendMail } from '../helpers/mailer.js';

/**
 * Controlador de usuários. Ele traduz entradas HTTP em chamadas ao
 * `UsersDataAccess` e, em seguida, converte o resultado em um objeto de
 * resposta uniforme usando os helpers em `helpers/httpResponse.js`.
 *
 * Cada método deste controlador corresponde a uma operação de negócio (por
 * exemplo, listar usuários, criar usuário, etc.).
 */
export default class UsersControllers {
    constructor() {
        // instância do layer de acesso a dados; poderia ser injetada para facilitar
        // testes unitários, mas usamos `new` diretamente por simplicidade.
        this.dataAccess = new UsersDataAccess()
    }

    /**
     * Recupera todos os usuários do banco.
     *
     * @returns {Promise<{success:boolean,statusCode:number,body:*}>} objeto de resposta
     */
    async getUsers() {
        try {
            const users = await this.dataAccess.getUsers()
            // transforma resultado em resposta padronizada
            return ok(users)
        } catch (error) {
            return serverError(error)
        }
    }

       async deleteUser(userId) {
        try {
            const result = await this.dataAccess.deleteUser(userId)
            // `deleteUser` já normaliza o retorno para o documento (ou null).
            if (!result) {
                return notFound('Usuário não encontrado')
            }
            // devolve o usuário que foi deletado como corpo da resposta
            return ok(result)
        } catch (error) {
            return serverError(error)
        }
    }

    async sendVerificationCode(userId) {
        try {
            const data = await this.dataAccess.generateResetCode(userId);
            if (!data) return notFound('Usuário não encontrado');

            // Envia o e-mail
            await sendMail({
                to: data.email,
                subject: 'Código de Verificação - Troca de Senha',
                html: `
                    <h2>Olá, ${data.name}</h2>
                    <p>Você solicitou a alteração da sua senha.</p>
                    <p>Seu código de verificação é: <strong><span style="font-size: 24px; letter-spacing: 2px;">${data.resetCode}</span></strong></p>
                    <p>Este código expira em 15 minutos.</p>
                    <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
                `
            });

            return ok({ message: 'Código enviado com sucesso para seu e-mail.' });
        } catch (error) {
            console.error('sendVerificationCode Error:', error);
            return serverError(error);
        }
    }

    async updateUser(userId, userData) {
        try {
            const result = await this.dataAccess.updateUser(userId, userData)
            
            if (!result) {
                return notFound('Usuário não encontrado')
            }
            
            // não retornamos campos sensíveis como senha/salt para o cliente
            const { password, salt, ...safe } = result;
            return ok(safe)

        } catch (error) {
            if (error.message === 'VERIFICATION_CODE_REQUIRED') {
                return badRequest('O código de verificação é obrigatório para alterar a senha.');
            }
            if (error.message === 'INVALID_CODE') {
                return badRequest('Código de verificação inválido ou incorreto.');
            }
            if (error.message === 'EXPIRED_CODE') {
                return badRequest('O código de verificação expirou. Solicite um novo.');
            }
            if (error.message === 'USER_NOT_FOUND') {
                return notFound('Usuário não encontrado.');
            }
            return serverError(error)
        }
    }
} 