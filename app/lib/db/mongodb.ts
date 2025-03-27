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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy-cheats';

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
async function connectDB(): Promise<typeof mongoose> {
  // Se já temos uma conexão ativa, retorna ela
  if (global.mongoose.conn) {
    console.log('Utilizando conexão existente com MongoDB');
    return global.mongoose.conn;
  }

  // Se não há uma promessa de conexão em andamento, cria uma
  if (!global.mongoose.promise) {
    console.log('Conectando ao MongoDB...', MONGODB_URI);
    
    // Configurações melhoradas para a conexão
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // Aumenta o timeout para 30 segundos
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      family: 4, // Força IPv4
    };

    global.mongoose.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Conectado ao MongoDB com sucesso!');
        return mongoose;
      });
  }

  try {
    // Aguarda a promessa resolver e armazena a conexão
    const mongooseInstance = await global.mongoose.promise;
    global.mongoose.conn = mongooseInstance;
    
    return mongooseInstance;
  } catch (error: any) {
    // Em caso de erro, limpa a promessa para permitir nova tentativa
    global.mongoose.promise = null;
    
    // Mensagens de erro mais detalhadas
    console.error('Erro ao conectar ao MongoDB:');
    console.error(`Mensagem: ${error.message}`);
    console.error(`Código: ${error.code || 'N/A'}`);
    console.error(`Nome: ${error.name || 'N/A'}`);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('Erro de seleção de servidor MongoDB. Verifique se:');
      console.error('1. A string de conexão está correta');
      console.error('2. O servidor MongoDB está acessível');
      console.error('3. O nome de usuário e senha estão corretos');
      console.error('4. O firewall permite conexões');
    }
    
    throw error;
  }
}

export default connectDB; 