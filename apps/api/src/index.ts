import { createApp } from './app.js';
import { config } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`🚀 Match My Jobs API running on port ${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🛡️  Auth & Profiles endpoints ready`);
  console.log(`🏥 Health check: http://localhost:${config.port}/api/health`);
  console.log(`===============================================`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during disconnect:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
