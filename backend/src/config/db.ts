import mongoose from 'mongoose';
import { config } from './env';

let memoryServerInstance: any = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  const connectionUri = config.mongoUri;

  // Explicit in-memory request via URI
  if (connectionUri === 'memory' || connectionUri === 'in-memory') {
    console.log('[Database] In-memory MongoDB explicitly requested via URI.');
    return startMemoryDB();
  }

  try {
    // Mask password credentials for safe logging
    const sanitizedUri = connectionUri.replace(/\/\/(.*):(.*)@/, '//***:***@');
    console.log(`[Database] Connecting to MongoDB Atlas cluster at: ${sanitizedUri}`);

    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[Database] Connected successfully to MongoDB Atlas host: ${conn.connection.host}, database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[Database Error] Runtime MongoDB error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database Warning] MongoDB Atlas connection disconnected.');
    });

    return conn;
  } catch (error: any) {
    console.error(`[Database Error] Failed to connect to MongoDB Atlas: ${error.message}`);

    // ONLY fall back to in-memory server if explicitly allowed via environment configuration
    if (config.allowMemoryDbFallback) {
      console.warn('[Database Warning] Connection failed. Explicit dev fallback ALLOW_MEMORY_DB_FALLBACK=true enabled. Starting in-memory instance...');
      return startMemoryDB();
    }

    console.error('[Database Fatal] Production mode: Automatic memory server fallback is disabled. Exiting application process.');
    process.exit(1);
  }
};

async function startMemoryDB(): Promise<typeof mongoose> {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    if (!memoryServerInstance) {
      memoryServerInstance = await MongoMemoryServer.create();
    }
    const memoryUri = memoryServerInstance.getUri();
    console.log('[Database] In-memory MongoDB server running at:', memoryUri);

    const conn = await mongoose.connect(memoryUri);
    console.log(`[Database] Connected successfully to In-Memory MongoDB database: ${conn.connection.name}`);
    return conn;
  } catch (err: any) {
    console.error('[Database Error] Failed to start In-Memory MongoDB:', err.message);
    throw err;
  }
}

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    console.log('[Database] MongoDB connection closed gracefully.');
  } catch (error: any) {
    console.error(`[Database Error] Error during disconnect: ${error.message}`);
  }
};
