import { Mongo } from "../database/mongo.js";
import { ObjectId } from "mongodb";

const collectionName = 'cash_registers';
const ordersCollection = 'orders';

export default class CashRegistersDataAccess {
    
    async getActiveRegister() {
        // Encontra o registro que ainda não foi fechado
        const result = await Mongo.db.collection(collectionName).findOne({ status: 'open' });
        return result;
    }

    async getRegisters() {
        const result = await Mongo.db.collection(collectionName)
            .find({})
            .sort({ openedAt: -1 }) // mais recentes primeiro
            .toArray();
        return result;
    }

    async openRegister(data) {
        // Garantir que não tenha outro aberto
        const active = await this.getActiveRegister();
        if (active) throw new Error("Você já possui um caixa aberto.");

        const register = {
            initialValue: Number(data.initialValue) || 0,
            status: 'open',
            openedAt: new Date(),
            closedAt: null,
            openedBy: data.openedBy || null,
            withdrawals: []
        };

        const result = await Mongo.db.collection(collectionName).insertOne(register);
        return { ...register, _id: result.insertedId };
    }

    async withdraw(registerId, withdrawalData) {
        const withdrawal = {
            id: new ObjectId().toString(),
            value: Number(withdrawalData.value) || 0,
            reason: withdrawalData.reason || 'Sangria',
            timestamp: new Date(),
            createdBy: withdrawalData.createdBy || null
        };

        const result = await Mongo.db.collection(collectionName).findOneAndUpdate(
            { _id: new ObjectId(registerId), status: 'open' },
            { $push: { withdrawals: withdrawal } },
            { returnDocument: 'after' }
        );

        return result && (result.value || result);
    }

    async closeRegister(registerId, closedBy) {
        // TRAVA (LOCK): Primeiro alteramos atomicamente o status para 'closing'.
        // Isso impede que novos pedidos sejam inseridos (`getActiveRegister` procura 'open').
        const registerResult = await Mongo.db.collection(collectionName).findOneAndUpdate(
            { _id: new ObjectId(registerId), status: 'open' },
            { $set: { status: 'closing' } },
            { returnDocument: 'after' }
        );
        const register = registerResult && (registerResult.value || registerResult);

        if (!register) {
            throw new Error('Caixa não encontrado, já fechado ou em processo de fechamento.');
        }

        const closedAt = new Date();

        // Buscar todos os pedidos vinculados a este caixa pelo cashRegisterId
        // O cashRegisterId é salvo como string no pedido — usamos o registerId original
        const registerIdStr = registerId.toString();
        const orders = await Mongo.db.collection(ordersCollection)
            .find({ 
                cashRegisterId: registerIdStr,
                status: { $ne: 'Cancelado' }
            }).toArray();

        // Calcular totais
        let totals = {
            Dinheiro: 0,
            Pix: 0,
            Cartão: 0,
            totalSold: 0
        };

        orders.forEach(order => {
            const method = order.paymentMethod || 'Dinheiro';
            const value = Number(order.total) || 0;
            totals.totalSold += value;
            if (totals[method] !== undefined) {
                totals[method] += value;
            } else {
                totals[method] = value;
            }
        });

        const totalWithdrawals = register.withdrawals.reduce((sum, w) => sum + w.value, 0);

        // Valor esperado = Inicial + (Sold Dinheiro) - Withdrawals
        // Obs: Pix e Cartão vão direto para a conta, mas na gaveta ficam o Inicial + Dinheiro - Retiradas.
        // Fica a critério do negócio. Geralmente mostraremos o saldo de Gaveta.
        const expectedCashBal = register.initialValue + totals.Dinheiro - totalWithdrawals;

        const updateData = {
            status: 'closed',
            closedAt: closedAt,
            closedBy: closedBy || null,
            totals: totals,
            totalWithdrawals: totalWithdrawals,
            expectedCashBal: expectedCashBal,
            ordersCount: orders.length,
            // poderíamos salvar a array com id dos pedidos por segurança de histórico estático
            linkedOrders: orders.map(o => o._id)
        };

        const result = await Mongo.db.collection(collectionName).findOneAndUpdate(
            { _id: new ObjectId(registerId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        return result && (result.value || result);
    }
}
