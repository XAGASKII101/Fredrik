import { ConnectionState, DisconnectReason, WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import chalk from 'chalk';
import botConfig from '../config/index.js';
import logger from '../lib/logger.js';
import httpServer from '../lib/http.js';
import whatsappClient from '../lib/whatsapp.js';
import scheduler from '../lib/scheduler.js';

export async function handleConnectionUpdate(
  sock: WASocket,
  update: Partial<ConnectionState>,
  reconnect: () => Promise<void>
): Promise<void> {
  const { connection, lastDisconnect, qr } = update;
  const config = botConfig.get();

  if (qr) {
    // Generate base64 DataURL for browser consumption
    try {
      const dataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8, color: { dark: '#000000', light: '#ffffff' } });
      whatsappClient.setQr(qr, dataUrl);
    } catch (err) {
      logger.error({ err }, 'Failed to render QR Code to DataURL');
      whatsappClient.setQr(qr, '');
    }

    if (!config.PAIRING_CODE_NUMBER) {
      console.log('\n' + chalk.yellow.bold('════════════════════════════════════════════════'));
      console.log(chalk.cyan.bold(' SCAN THE QR CODE BELOW OR USE WEB PORTAL TO CONNECT:'));
      console.log(chalk.yellow.bold('════════════════════════════════════════════════\n'));
      qrcodeTerminal.generate(qr, { small: true });
      console.log(chalk.gray('\nWaiting for WhatsApp authorization (or use web portal to pair)...\n'));
    }
  }

  if (connection === 'close') {
    httpServer.setConnected(false);
    const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
    whatsappClient.setDisconnected(reason);
    const shouldReconnect = reason !== DisconnectReason.loggedOut;

    logger.warn({ reason, error: lastDisconnect?.error }, 'WhatsApp connection closed');

    if (reason === DisconnectReason.loggedOut) {
      logger.error('Session logged out. Please clear session folder and re-authenticate.');
    } else if (shouldReconnect) {
      logger.info('Reconnecting to WhatsApp in 5 seconds...');
      setTimeout(async () => {
        try {
          await reconnect();
        } catch (err) {
          logger.error({ err }, 'Failed to reconnect socket');
        }
      }, 5000);
    }
  } else if (connection === 'open') {
    httpServer.setConnected(true);
    whatsappClient.setConnected(sock.user);
    const botJid = sock.user?.id || '';
    const botNumber = botJid.split('@')[0].split(':')[0];

    // If owner number was set to auto, set it to bot user
    if (config.OWNER_NUMBER === 'auto') {
      botConfig.setOwnerNumber(botNumber);
    }

    console.log('\n' + chalk.green.bold('╔════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold(`║       FREDRIK BOT SUCCESSFULLY CONNECTED!       ║`));
    console.log(chalk.green.bold('╚════════════════════════════════════════════════╝'));
    console.log(chalk.cyan(`  🤖 Bot Name:     ${config.BOT_NAME}`));
    console.log(chalk.cyan(`  📱 Phone Number: ${botNumber}`));
    console.log(chalk.cyan(`  🔣 Prefix:       ${config.PREFIX}`));
    console.log(chalk.cyan(`  🌐 Mode:         ${config.MODE}`));
    console.log(chalk.cyan(`  🧠 AI Model:     ${config.OPENROUTER_MODEL}`));
    console.log(chalk.yellow('────────────────────────────────────────────────\n'));

    // Initialize reminder scheduler
    scheduler.init(sock);
  }
}
