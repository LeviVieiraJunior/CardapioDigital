import { Mongo } from "../database/mongo.js";
import { ObjectId } from "mongodb";

const collectionName = 'orders'

/**
 * Classe que encapsula todas as operações diretas no banco de dados
 * relacionadas à coleção de pratos. Ela não sabe nada sobre HTTP ou
 * validação; recebe apenas parâmetros e retorna dados brutos.
 */
export default class OrdersDataAccess {
    /**
     * Busca todos os documentos da coleção de pratos.
     *
     * @returns {Promise<Array>} array de pratos (cada um é um objeto do
     *                            Mongo). Se não houver nenhum, retorna []
     */
    async getOrders() {
        const result = await Mongo.db
            .collection(collectionName)
            // retorna cursor para todos os documentos; poderia receber filtro
            .aggregate([
                {
                     $lookup: {
                        from: 'orderItems',
                        localField: '_id',
                        foreignField: 'orderId',
                        as: 'orderItems'
                    }
                }
            ])
            // converte o cursor em array para manipulação mais fácil
            .toArray()

        return result
    }

    async addOrder(orderData){
        const { items, ...orderDataRest } = orderData

        // SEGURANÇA: Remover valores injetáveis vindos do Frontend
        delete orderDataRest.total;
        delete orderDataRest.totalAmount;
        delete orderDataRest.deliveryFee;

        // Buscar preços no Banco (Fonte da Verdade)
        const plateIds = items.map(i => {
           try { return new ObjectId(i.plateId) } catch { return null }
        }).filter(Boolean);

        const officialPlates = await Mongo.db.collection('plates').find({ _id: { $in: plateIds } }).toArray();
        const pricesMap = {};
        officialPlates.forEach(p => pricesMap[p._id.toString()] = Number(p.price) || 0);

        let subtotal = 0;
        const validItems = [];

        items.forEach(item => {
            const pidStr = String(item.plateId);
            if (pricesMap[pidStr] !== undefined) {
                const officialPrice = pricesMap[pidStr];
                const qty = Number(item.quantity) || 1;
                subtotal += officialPrice * qty;
                validItems.push({
                    plateId: new ObjectId(item.plateId),
                    quantity: qty,
                    price: officialPrice // Salvar histórico do preço de venda autêntico
                });
            }
        });

        // Computar a taxa real a partir do Banco
        const settings = await Mongo.db.collection('settings').findOne({}) || { cityDeliveryFee: 0, ruralDeliveryFee: 0 };
        let officialDeliveryFee = 0;
        if (orderDataRest.deliveryType === 'city') officialDeliveryFee = Number(settings.cityDeliveryFee) || 0;
        if (orderDataRest.deliveryType === 'rural') officialDeliveryFee = Number(settings.ruralDeliveryFee) || 0;

        const officialTotal = subtotal + officialDeliveryFee;

        // Configurar a Ordem com os valores Blindados
        orderDataRest.total = officialTotal;
        orderDataRest.deliveryFee = officialDeliveryFee;
        orderDataRest.createdAt = new Date().toISOString() // salvar como ISO string para comparações consistentes
        orderDataRest.pickupStatus = 'Pendente'
        orderDataRest.userId = new ObjectId(orderDataRest.userId)
        
        const newOrder = await Mongo.db
        .collection(collectionName)
        .insertOne(orderDataRest)

        if(!newOrder.insertedId) {
            throw new Error('A ordem nao foi inserida')
        }

        validItems.forEach((item) => {
            item.orderId = new ObjectId(newOrder.insertedId)
        })

        if (validItems.length > 0) {
            await Mongo.db
            .collection('orderItems')
            .insertMany(validItems)
        }

        // Retornar o pedido criado com todos os campos (inclui cashRegisterId)
        const createdOrder = await Mongo.db
            .collection(collectionName)
            .findOne({ _id: newOrder.insertedId })

        return createdOrder
    }
    // método para eliminar um usuário pelo ID
    // retorna o documento excluído, ou null se não existir.
    async deleteOrder(orderId) {
        const result = await Mongo.db
            .collection(collectionName)
            .findOneAndDelete({ _id: new ObjectId(orderId) })

        // alguns drivers devolvem o próprio documento; outros empacotam em
        // { value: doc }. Normalizamos para sempre retornar apenas o doc.
        return result && (result.value || result)
    }

        /**
     * Atualiza um usuário pelo ID. Se `userData` contiver uma nova senha,
     * ela será re-hashada com salt antes de gravar no banco.
     *
     * @param {string} userId - _id Mongo como string
     * @param {Object} userData - campos a alterar (pode incluir `password`)
     * @returns {Promise<Object|null>} documento atualizado ou null se não
     *                                  existir
     */
    async updateOrder(orderId, orderData) {
        // se veio senha, precisamos aplicar o mesmo processo de criptografia
        const result = await Mongo.db
            .collection(collectionName)
            .findOneAndUpdate(
                { _id: new ObjectId(orderId) },
                { $set: orderData },
                { returnDocument: 'after' } // retorna o documento já alterado
            );
        // normalize similar a deleteUser
        return result && (result.value || result);
    }
} 