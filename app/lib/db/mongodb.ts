import mongoose from 'mongoose';
import logger from '../logger';

// Estado de conexão
const connection: {
  isConnected: number;
} = {
  isConnected: 0,
};

// URL do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasystore';

// Função para conectar ao MongoDB
async function connectDB() {
  logger.info(`URI do MongoDB usado para conexão: ${MONGODB_URI.replace(/:[^:/@]+@/, ':****@')}`);
  
  // Verificar se já existe uma conexão ativa
  if (connection.isConnected) {
    logger.info('Utilizando conexão existente com MongoDB');
    return mongoose;
  }
  
  // Se estamos em produção, usar configurações otimizadas
  if (process.env.NODE_ENV === 'production') {
    mongoose.set('debug', false);
    mongoose.set('autoIndex', false);
  } else {
    // Em desenvolvimento, habilitar log mais detalhado
    mongoose.set('debug', false); // Definir como true para debug detalhado
    mongoose.set('autoIndex', true);
  }
  
  // Definir opções de conexão
  const opts = {
    bufferCommands: true,
  };
  
  logger.info('Iniciando nova conexão com MongoDB...');
  
  // Verificar se a URI do MongoDB está definida
  if (!process.env.MONGODB_URI) {
    logger.warn('URI do MongoDB não definida no processo.env. Usando URI padrão.');
  }
  
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || MONGODB_URI);
    
    connection.isConnected = mongoose.connection.readyState;
    logger.info('Conectado ao MongoDB com sucesso');
    
    // Log de informações básicas da conexão
    logger.info('Todos os modelos básicos foram pré-carregados');
    
    return mongoose;
  } catch (error) {
    logger.error('Erro ao conectar com MongoDB:', error);
    throw error;
  }
}

export default connectDB;
export { connectDB as connectToDatabase };

// Função para limpar coleções (para desenvolvimento)
export async function clearCollection(collectionName: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.log('Não é possível limpar coleções em produção');
    return;
  }
  
  if (global.mongoose?.conn) {
    try {
      await global.mongoose.conn.connection.collection(collectionName).drop();
      console.log(`Coleção ${collectionName} foi limpa`);
    } catch (err) {
      console.log(`Erro ao limpar coleção ${collectionName}:`, err);
    }
  }
} 