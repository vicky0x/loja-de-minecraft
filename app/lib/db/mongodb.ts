import mongoose from 'mongoose';
import logger from '../logger';

// Estado de conexão
const connection: {
  isConnected: number;
  lastLogTime: number;
} = {
  isConnected: 0,
  lastLogTime: 0
};

// URL do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasystore';

// Função para conectar ao MongoDB
async function connectDB() {
  const now = Date.now();
  const LOG_THROTTLE_MS = 2000; // Tempo mínimo entre logs (2 segundos)
  
  // Verificar se já existe uma conexão ativa
  if (connection.isConnected) {
    // Limitar logs repetidos usando throttling
    if (now - connection.lastLogTime > LOG_THROTTLE_MS) {
      connection.lastLogTime = now;
      logger.info('Utilizando conexão existente com MongoDB');
    }
    return mongoose;
  }
  
  // Registrar tempo do log para throttling
  connection.lastLogTime = now;
  logger.info('Iniciando conexão com MongoDB');
  
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