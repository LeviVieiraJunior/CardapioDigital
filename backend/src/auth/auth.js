/**
 * ============================================================================
 * MODULO: auth.js
 * ============================================================================
 * PADRÃO DE PROJETO: JSON Web Token (JWT) + Autenticação Local
 * O QUE ESSE ARQUIVO FAZ:
 * Este arquivo define a estratégia local de login usando a biblioteca Passport.
 * Ele possui rotas para '/signup' (Registrar) e '/login' (Entrar), onde as senhas
 * são criptografadas (PBKDF2) com 'salt' para segurança.
 * Após o login, retorna um token JWT para ser usado nas rotas protegidas.
 * ============================================================================
 */
import express from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Mongo } from '../database/mongo.js';
import { sendMail } from '../helpers/mailer.js';

// Nome da coleção de usuários no MongoDB
const collectionName = 'users';

// Chave secreta para assinar tokens JWT. Em produção, mantenha isso em
// uma variável de ambiente (por exemplo, process.env.JWT_SECRET) e não use
// um valor "hard‑coded".
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- Helpers de criptografia ------------------------------------------------
// Os métodos nativos de crypto usam callbacks. Para usar async/await nós
// criamos funções que retornam Promises em torno de pbkdf2 e randomBytes.

/**
 * Gera um hash da senha usando PBKDF2.
 * @param {string} password - senha em texto plano
 * @param {Buffer} salt - salt aleatório (gerado com crypto.randomBytes)
 * @returns {Promise<Buffer>} - senha criptografada
 */
function hashPassword(password, salt) {
    return new Promise((resolve, reject) => {
        // 310000 iterações, tamanho de saída 32 bytes e sha256 como algoritmo
        crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, derivedKey) => {
            if (err) return reject(err);
            resolve(derivedKey);
        });
    });
}

/**
 * Compara uma senha em texto plano com o hash armazenado.
 * @param {string} password - senha em texto plano
 * @param {Buffer} salt - salt usado originalmente
 * @param {Buffer} storedHash - hash salvo no banco
 * @returns {Promise<boolean>} - true se as senhas coincidirem
 */
async function verifyPassword(password, salt, storedHash) {
    const hashed = await hashPassword(password, salt);
    // timingSafeEqual previne ataques de tempo
    return crypto.timingSafeEqual(storedHash, hashed);
}

// =====================
// Configuração do Passport LocalStrategy
// =====================
// LocalStrategy será usado futuramente para login
// Ele compara o email e senha do usuário com o banco
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    // Esta função é chamada pelo Passport quando for necessário autenticar
    // um usuário usando o esquema "local" (email + senha).
    // `done` é um callback no formato (error, user, info).
    try {
        // Procurando o usuário no banco pelo email sanitizando string (NoSQL Inj Prevention)
        const user = await Mongo.db
            .collection(collectionName)
            .findOne({ email: String(email) });

        if (!user) {
            return done(null, false, { message: 'Usuário não encontrado' });
        }

        // O campo salt deve estar presente; sem ele não há como verificar a
        // senha. Se ele estiver ausente, isso normalmente indica que o usuário
        // foi criado com um código antigo ou a inserção falhou.
        if (!user.salt) {
            return done(new Error('Salt ausente no registro do usuário'));
        }

        // senha armazenada e salt podem vir como Binary do Mongo;
        // por isso fazemos a conversão para Buffer.
        const saltBuffer = Buffer.from(user.salt.buffer || user.salt);
        const storedPassword = Buffer.from(user.password.buffer || user.password);

        const match = await verifyPassword(password, saltBuffer, storedPassword);
        if (!match) {
            return done(null, false, { message: 'Senha incorreta' });
        }

        // Para não expor informações sensíveis, removemos `password` e `salt`
        const { password: _, salt: __, ...rest } = user;
        return done(null, rest);
    } catch (error) {
        return done(error);
    }
}));

// =====================
// Criação do Router de autenticação
// =====================
const authRouter = express.Router();

// Middleware necessário para processar JSON no corpo da requisição
authRouter.use(express.json());

// Atalho útil: converte qualquer erro de rota async em resposta 500
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// =====================
// Rota POST /signup - Registro de usuário
// =====================
// Rota POST /signup - Registro de usuário
// Usamos `asyncHandler` para que qualquer exceção cai no middleware de erro
// global (se existir) e não precise repetir try/catch manualmente.
authRouter.post('/signup', asyncHandler(async (req, res) => {
    const { email, password, lgpdConsent, name } = req.body;

    // Validando se o email e senha foram enviados
    if (!email || !password || !lgpdConsent || !name) {
        return res.status(400).send({
            success: false,
            statusCode: 400,
            body: { text: 'Nome, e-mail, senha e consentimento da LGPD são obrigatórios!' }
        });
    }

    // Verificando se o usuário já existe no banco (Sanitizado NoSQL)
    const existing = await Mongo.db.collection(collectionName).findOne({ email: String(email) });
    if (existing) {
        return res.status(400).send({
            success: false,
            statusCode: 400,
            body: { text: 'O usuário já existe!' }
        });
    }

    // Criando um salt aleatório para a senha
    const salt = crypto.randomBytes(16);
    // Criptografando a senha de forma assíncrona
    const hashedPassword = await hashPassword(password, salt);

    // Salvando o usuário no banco com email, senha criptografada e salt
    const result = await Mongo.db.collection(collectionName).insertOne({
        name,
        email,
        password: hashedPassword,
        salt,
        lgpdConsent,
        isAdmin: false // por padrão, novos usuários não são admins
    });

    // Recuperando o usuário inserido para gerar o token
    const user = await Mongo.db
        .collection(collectionName)
        .findOne({ _id: new ObjectId(result.insertedId) });

    // Gerando um token JWT com id e email do usuário usando a chave secreta
    const token = jwt.sign({ id: user._id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });

    // Retornando sucesso com token e dados do usuário
    return res.send({
        success: true,
        statusCode: 200,
        text: 'Usuário registrado com sucesso!',
        token,
        user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin },
        logged: true
    });
}));

authRouter.post('/login', (req, res) => {
    passport.authenticate('local', (error, user) => {

        //se der erro durante a autenticação, retorna status 400 com mensagem de erro
        if (error) {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                body: {
                    text: 'Erro durante a autenticação!',
                    error: error.message || error
                }
            });
        }

        //se o usuário não for encontrado, retorna status 400 com mensagem de erro
        if (!user) {
            return res.status(400).send({
                success: false,
                statusCode: 400,
                body: {
                    text: 'A senha está incorreta'
                }
            });
        }

        //se tudo der certo, gera um token JWT com um payload mínimo e retorna status 200
        const payload = { id: user._id, email: user.email, isAdmin: user.isAdmin };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        
        // Remove campos sensíveis antes de enviar
        const { password: _, salt: __, ...safeUser } = user;
        
        return res.status(200).send({
            success: true,
            statusCode: 200,
            body: {
                text: 'Usuário logado com sucesso!',
                user: safeUser,
                token
            }
        });
    })(req, res);
});

authRouter.post('/verify-admin-token', asyncHandler(async (req, res) => {
    const { token } = req.body;
    const adminToken = process.env.ADMIN_TOKEN || 'RABCX'; // Fallback só por precaução até forçarem
    
    if (token && token.trim().toUpperCase() === adminToken) {
        return res.status(200).send({ success: true, statusCode: 200, body: { text: "Token válido." } });
    }
    
    return res.status(403).send({ success: false, statusCode: 403, body: { text: "Token inválido." } });
}));

// =====================
// Rota POST /forgot-password - Envio de e-mail p/ recuperação
// =====================
authRouter.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).send({ success: false, statusCode: 400, body: { text: "E-mail é obrigatório." } });

    const user = await Mongo.db.collection(collectionName).findOne({ email: String(email) });
    if (!user) {
        // Por segurança, não informamos se o email existe ou não, apenas damos sucesso.
        return res.status(200).send({ success: true, statusCode: 200, body: { text: "Se o e-mail existir logo você receberá um link." } });
    }

    // Gera um token seguro e data de expiração (15 minutos)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await Mongo.db.collection(collectionName).updateOne(
        { _id: user._id },
        { $set: { resetToken, resetTokenExpires } }
    );

    // O link aponta para o frontend, na rota /reset-password
    // Considerando que o front está no http://localhost:5173
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendMail({
        to: user.email,
        subject: 'Recuperação de Senha - Antigravity',
        html: `
            <h2>Olá, ${user.name}</h2>
            <p>Você solicitou a alteração da sua senha.</p>
            <p>Clique no link abaixo para redefini-la. Este link é válido por 15 minutos.</p>
            <a href="${resetLink}" style="display:inline-block; padding:10px 20px; background-color:#2563eb; color:white; text-decoration:none; border-radius:5px;">Redefinir Minha Senha</a>
            <p>Se você não solicitou essa alteração, basta ignorar este e-mail.</p>
        `
    });

    return res.status(200).send({ success: true, statusCode: 200, body: { text: "Link de recuperação enviado com sucesso." } });
}));

// =====================
// Rota POST /reset-password - Conclusão da alteração de senha
// =====================
authRouter.post('/reset-password', asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).send({ success: false, statusCode: 400, body: { text: "Token e nova senha são obrigatórios." } });
    }

    const user = await Mongo.db.collection(collectionName).findOne({ 
        resetToken: token,
        resetTokenExpires: { $gt: new Date() } // Expiração deve ser maior que AGORA
    });

    if (!user) {
        return res.status(400).send({ success: false, statusCode: 400, body: { text: "Token inválido ou expirado. Tente novamente." } });
    }

    // Hash da nova senha
    const salt = crypto.randomBytes(16);
    const hashedPassword = await hashPassword(newPassword, salt);

    // Atualiza o banco removendo o token usado e alterando a senha
    await Mongo.db.collection(collectionName).updateOne(
        { _id: user._id },
        { 
            $set: { password: hashedPassword, salt: salt },
            $unset: { resetToken: "", resetTokenExpires: "" }
        }
    );

    return res.status(200).send({ success: true, statusCode: 200, body: { text: "Senha alterada com sucesso. Você pode fazer o login." } });
}));

// =====================
// Rota POST /logout - Revogação de token (Blacklist)
// =====================
authRouter.post('/logout', asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // Inserimos o token numa blacklist
        await Mongo.db.collection('token_blacklist').insertOne({
            token,
            createdAt: new Date()
        });
    }

    return res.status(200).send({
        success: true,
        statusCode: 200,
        body: { text: "Logout efetuado com sucesso. Token invalidado no servidor." }
    });
}));

export default authRouter;