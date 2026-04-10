/**
 * ============================================================================
 * SERVIDOR: index.js (Node.js/Express)
 * ============================================================================
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Ponto de partida do servidor.
 * 2. Conecta ao Banco de Dados MongoDB usando as credenciais do arquivo .env.
 * 3. Habilita Middlewares globais como CORS e JSON Parser.
 * 4. Registra todas as Rotas (Orders, Plates, Categories, Auth, Users).
 * 5. Inicia a escuta na porta 3000 (ou configurada).
 * ============================================================================
 */
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// importação do módulo responsável pela conexão com MongoDB
import { Mongo } from './database/mongo.js'

// dotenv permite carregar variáveis do arquivo .env para process.env
import { config } from 'dotenv'
import authRouter from './auth/auth.js'
import usersRouter from './routes/users.js'
import platesRouter from './routes/plates.js'
import ordersRouter from './routes/orders.js'
import categoriesRouter from './routes/categories.js'
import settingsRouter from './routes/settings.js'
import cashRegistersRouter from './routes/cashRegisters.js'

// configura as variáveis de ambiente antes de usá-las
config()

/**
 * Ponto de entrada da aplicação. Define hostname/porta, configura middlewares,
 * conecta ao banco e registra as rotas disponíveis.
 */
async function main () {
    const hostname = 'localhost'
    const port = 3000

    const app = express()

    // Conecta ao Mongo e guarda o resultado de log
    const mongoConnection = await Mongo.connect({
        mongoConnectionString: process.env.MONGO_CS,
        mongoDbName: process.env.MONGO_DB_NAME
    })
    console.log(mongoConnection)

    // Limitador de taxa global para proteger contra DDoS básico e brute force moderado
    const globalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, /* 15 minutos */
        max: 350, /* Limite de 350 requisições por IP */
        message: { success: false, statusCode: 429, body: { text: "Volume de acessos muito alto. Aguarde um momento e tente novamente." } }
    })

    // middlewares globais
    app.use(helmet())        // Adiciona headers de segurança (XSS, ClickHijacking, Remove Info Server)
    app.use(globalLimiter)
    app.use(express.json({ limit: '50mb' }))   // lê corpo JSON automaticamente (com limite de 50MB p/ fotos)
    app.use(express.urlencoded({ limit: '50mb', extended: true }))
    
    // Lista de origens permitidas
    const allowedOrigins = ['http://localhost:5173', 'https://antigravity-app.com']
    app.use(cors({
        origin: function (origin, callback) {
            // Se não tiver origem (ex: Postman interno) ou estiver na lista, permitir.
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error('Acesso bloqueado por diretriz CORS de Segurança.'))
            }
        },
        credentials: true
    }))

    // rota de teste inicial
    app.get('/', (req, res) => {
        res.send({
            success: true,
            statusCode: 200,
            body: 'Bem vindo ao MeuCardapio'
        })
    })

    app.use('/auth', authRouter)
    app.use('/users', usersRouter)
    app.use('/plates', platesRouter)
    app.use('/orders', ordersRouter)
    app.use('/categories', categoriesRouter)
    app.use('/settings', settingsRouter)
    app.use('/cash-registers', cashRegistersRouter)

    // inicia o servidor HTTP
    app.listen(port, () => {
        console.log(`Servidor rodando: http://${hostname}:${port}`)
    })
}

// invoca a função principal (não precisa capturar retorno)
main()