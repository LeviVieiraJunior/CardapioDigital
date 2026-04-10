import jwt from 'jsonwebtoken';
import { Mongo } from '../database/mongo.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * Middleware para garantir que o usuário está autenticado e possui um token válido.
 */
export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({
                success: false,
                statusCode: 401,
                body: { text: 'Acesso negado. Token de autenticação não fornecido.' }
            });
        }

        const token = authHeader.split(' ')[1];
        
        // VERIFICAÇÃO DE BLACKLIST (Proteção Secundária JWT pós Logout)
        const isBlacklisted = await Mongo.db.collection('token_blacklist').findOne({ token });
        if (isBlacklisted) {
            return res.status(401).send({
                success: false,
                statusCode: 401,
                body: { text: 'Acesso negado. A sessão vinculada a este Token já foi encerrada.' }
            });
        }

        // Verifica se o token é válido assinaturamente
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Adiciona as informações do usuário logado na requisição (req.user)
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send({
            success: false,
            statusCode: 401,
            body: { text: 'Token inválido ou expirado. Por favor, faça login novamente.' }
        });
    }
};

/**
 * Middleware para garantir que o usuário logado é um Administrador.
 * Deve ser usado nas rotas após o requireAuth OU ser capaz de validar por conta própria.
 */
export const requireAdmin = async (req, res, next) => {
    try {
        // Se o requireAuth já passou, req.user existe. Se usarem esse direto, verificamos:
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({
                success: false,
                statusCode: 401,
                body: { text: 'Acesso negado. Token não fornecido.' }
            });
        }

        const token = authHeader.split(' ')[1];

        // VERIFICAÇÃO DE BLACKLIST
        const isBlacklisted = await Mongo.db.collection('token_blacklist').findOne({ token });
        if (isBlacklisted) {
            return res.status(401).send({
                success: false,
                statusCode: 401,
                body: { text: 'Acesso negado. Sessão Invalida/Suspensa.' }
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded.isAdmin) {
            return res.status(403).send({
                success: false,
                statusCode: 403,
                body: { text: 'Acesso negado. Esta ação requer privilégios de administrador.' }
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send({
            success: false,
            statusCode: 401,
            body: { text: 'Token de administrador inválido ou expirado.' }
        });
    }
};
