import chalk from 'chalk';
import botConfig from './config/index.js';
import registerAllCommands from './commands/index.js';
import whatsappClient from './lib/whatsapp.js';
import httpServer from './lib/http.js';
import logger from './lib/logger.js';

async function bootstrap(): Promise<void> {
  console.log(chalk.cyan.bold(`
  ███████╗██████╗ ███████╗██████╗ ██████╗ ██╗██╗  ██╗
  ██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗██║██║ ██╔╝
  █████╗  ██████╔╝█████╗  ██║  ██║██████╔╝██║█████╔╝ 
  ██╔══╝  ██╔══██╗██╔══╝  ██║  ██║██╔══██╗██║██╔═██╗ 
  ██║     ██║  ██║███████╗██████╔╝██║  ██║██║██║  ██╗
  ╚═╝     ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
        WhatsApp Multi-Device AI Automation Bot
  `));

  const config = botConfig.get();
  logger.info({ bot: config.BOT_NAME, mode: config.MODE }, 'Initializing Fredrik bot');

  // 1. Register all command modules
  registerAllCommands();

  // 2. Start HTTP health check server
  httpServer.start();

  // 3. Connect to WhatsApp
  try {
    await whatsappClient.start();
  } catch (err) {
    logger.fatal({ err }, 'Failed to start WhatsApp client');
    process.exit(1);
  }
}

// Graceful shutdown and anti-crash handlers
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await whatsappClient.stop();
    httpServer.stop();
    logger.info('Clean shutdown complete.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception in runtime');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection in runtime');
});

bootstrap();
