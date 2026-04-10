import express from 'express';
import CashRegistersControllers from '../controllers/cashRegisters.js';
import { requireAdmin } from '../middlewares/auth.js';

const cashRegistersRouter = express.Router();
const controllers = new CashRegistersControllers();

cashRegistersRouter.get('/active', async (req, res) => {
    const { success, statusCode, body } = await controllers.getActiveRegister();
    return res.status(statusCode).send({ success, statusCode, body });
});

cashRegistersRouter.get('/', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await controllers.getRegisters();
    return res.status(statusCode).send({ success, statusCode, body });
});

cashRegistersRouter.post('/open', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await controllers.openRegister(req.body);
    return res.status(statusCode).send({ success, statusCode, body });
});

cashRegistersRouter.post('/:id/withdraw', requireAdmin, async (req, res) => {
    const { success, statusCode, body } = await controllers.withdraw(req.params.id, req.body);
    return res.status(statusCode).send({ success, statusCode, body });
});

cashRegistersRouter.post('/:id/close', requireAdmin, async (req, res) => {
    const { closedBy } = req.body;
    const { success, statusCode, body } = await controllers.closeRegister(req.params.id, closedBy);
    return res.status(statusCode).send({ success, statusCode, body });
});

export default cashRegistersRouter;
