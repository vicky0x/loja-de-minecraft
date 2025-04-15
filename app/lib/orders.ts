import mongoose from 'mongoose';
import connectDB from './db/mongodb';
import logger from './logger';

// Importando o modelo de Order do arquivo correto
import Order from './models/order';

/**
 * Busca um pedido pelo ID
 * @param orderId ID do pedido
 * @returns Objeto do pedido ou null se não encontrado
 */
export async function getOrderById(orderId: string) {
  try {
    await connectDB();
    
    if (!mongoose.isValidObjectId(orderId)) {
      logger.warn(`ID de pedido inválido: ${orderId}`);
      return null;
    }
    
    const order = await Order.findById(orderId).lean();
    
    if (!order) {
      logger.warn(`Pedido não encontrado: ${orderId}`);
      return null;
    }
    
    return order;
  } catch (error) {
    logger.error(`Erro ao buscar pedido ${orderId}:`, error);
    throw error;
  }
}

/**
 * Atualiza um pedido com as informações fornecidas
 * @param orderId ID do pedido a ser atualizado
 * @param updateData Dados a serem atualizados
 * @returns Pedido atualizado
 */
export async function updateOrder(orderId: string, updateData: Record<string, any>) {
  try {
    await connectDB();
    
    if (!mongoose.isValidObjectId(orderId)) {
      logger.warn(`ID de pedido inválido para atualização: ${orderId}`);
      throw new Error('ID de pedido inválido');
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedOrder) {
      logger.warn(`Pedido não encontrado para atualização: ${orderId}`);
      throw new Error('Pedido não encontrado');
    }
    
    logger.info(`Pedido ${orderId} atualizado com sucesso`);
    return updatedOrder;
  } catch (error) {
    logger.error(`Erro ao atualizar pedido ${orderId}:`, error);
    throw error;
  }
} 