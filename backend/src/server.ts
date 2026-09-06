import app from './app';
import { config, validateEnv } from './config/env';
import { connectDB, disconnectDB } from './config/db';

async function startServer(): Promise<void> {
  console.log('==================================================');
  console.log('    CAPITALGUARD PORTFOLIO ENGINE BACKEND (MVP)   ');
  console.log('==================================================');

  // 1. Validate Environment Variables
  validateEnv();

  // 2. Connect to Database
  await connectDB();

  // 3. Start HTTP Server
  const server = app.listen(config.port, () => {
    console.log(`[Server] CapitalGuard API running on http://localhost:${config.port}`);
    console.log(`[Server] Health check endpoint: http://localhost:${config.port}/api/health`);
  });

  // Graceful Shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      console.log('[Server] Shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer();
