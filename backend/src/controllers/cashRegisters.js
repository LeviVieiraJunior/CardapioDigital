import CashRegistersDataAccess from '../dataAccess/cashRegisters.js';
import { ok, notFound, serverError, badRequest } from '../helpers/httpResponse.js';

export default class CashRegistersControllers {
    constructor() {
        this.dataAccess = new CashRegistersDataAccess();
    }

    async getActiveRegister() {
        try {
            const register = await this.dataAccess.getActiveRegister();
            return ok(register); // pode retornar null se não houver ativo (o que indica loja fechada)
        } catch (error) {
            return serverError(error);
        }
    }

    async getRegisters() {
        try {
            const registers = await this.dataAccess.getRegisters();
            return ok(registers);
        } catch (error) {
            return serverError(error);
        }
    }

    async openRegister(data) {
        try {
            const newRes = await this.dataAccess.openRegister(data);
            return ok(newRes);
        } catch (error) {
            if (error.message.includes('já possui um caixa aberto')) {
                return badRequest(error.message);
            }
            return serverError(error);
        }
    }

    async withdraw(id, data) {
        try {
            const result = await this.dataAccess.withdraw(id, data);
            if (!result) return notFound('Caixa não encontrado ou já fechado.');
            return ok(result);
        } catch (error) {
            return serverError(error);
        }
    }

    async closeRegister(id, closedBy) {
        try {
            const result = await this.dataAccess.closeRegister(id, closedBy);
            return ok(result);
        } catch (error) {
            if (error.message.includes('já fechado')) {
                return badRequest(error.message);
            }
            return serverError(error);
        }
    }
}
