import mongoose from 'mongoose';

// Definir a interface para o cache de conexão
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declarar o tipo global
declare global {
  var mongoose: MongooseCache;
}

// Usar o URI de conexão do .env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-cheats';

// Assegurar que estamos usando o URI correto
console.log("URI do MongoDB usado para conexão:", MONGODB_URI.replace(/:[^:]*@/, ':****@'));

// Inicializar o cache
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

// Função para limpar coleções (para desenvolvimento)
export async function clearCollection(collectionName: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.log('Não é possível limpar coleções em produção');
    return;
  }
  
  if (global.mongoose.conn) {
    try {
      await global.mongoose.conn.connection.collection(collectionName).drop();
      console.log(`Coleção ${collectionName} foi limpa`);
    } catch (err) {
      console.log(`Erro ao limpar coleção ${collectionName}:`, err);
    }
  }
}

// Função para conectar ao MongoDB
export default async function connectDB() {
  try {
    // Se já estiver conectado, retornar a conexão existente
    if (mongoose.connection.readyState >= 1) {
      console.log('Utilizando conexão existente com MongoDB');
      return;
    }

    // Validar a URI de conexão
    if (!process.env.MONGODB_URI) {
      throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
    }

    // Iniciar a conexão
    console.log('Iniciando nova conexão com MongoDB...');
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB com sucesso');
    
    // Configurações recomendadas para a conexão
    mongoose.set('strictQuery', true);
    
    // Pré-carregar todos os modelos importantes para evitar problemas de referência
    try {
      // Usando require para garantir que os modelos sejam carregados sincronamente
      if (!mongoose.models.Product) require('../models/product');
      if (!mongoose.models.User) require('../models/user');
      if (!mongoose.models.Order) require('../models/order');
      if (!mongoose.models.StockItem) require('../models/stock');
      if (!mongoose.models.Category) try { require('../models/category'); } catch (e) {}
      if (!mongoose.models.Coupon) try { require('../models/coupon'); } catch (e) {}
      
      console.log('Todos os modelos básicos foram pré-carregados');
    } catch (modelError) {
      console.warn('Erro ao pré-carregar modelos:', modelError);
      // Continuar mesmo com erro no carregamento de modelos
    }
    
    // Registrar eventos da conexão para facilitar a depuração
    mongoose.connection.on('error', err => {
      console.error('Erro na conexão MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB desconectado');
    });
    
    // Preparar para encerramento da aplicação
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexão MongoDB encerrada');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    throw error;
  }
} 