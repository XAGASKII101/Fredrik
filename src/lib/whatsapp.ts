import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
} from '@whiskeysockets/baileys';
import chalk from 'chalk';
import pino from 'pino';
import botConfig from '../config/index.js';
import sessionManager from './session.js';
import logger from './logger.js';
import { handleConnectionUpdate } from '../events/connection.update.js';
import { handleMessagesUpsert } from '../events/messages.upsert.js';
import { handleMessagesUpdate } from '../events/messages.update.js';
import { handleCall } from '../events/call.js';
import { handleGroupParticipantsUpdate } from '../events/group-participants.update.js';

export type ConnectionStatusType = 'disconnected' | 'connecting' | 'qr_ready' | 'code_ready' | 'connected';

export class WhatsAppClient {
  public sock: WASocket | null = null;
  private isConnecting = false;
  private status: ConnectionStatusType = 'disconnected';
  private currentQr: string | null = null;
  private currentQrDataUrl: string | null = null;
  private currentPairingCode: string | null = null;
  private currentPairingNumber: string | null = null;
  private connectedNumber: string | null = null;
  private connectedName: string | null = null;
  private lastDisconnectReason: string | null = null;
  private connectionStartTime: number | null = null;

  public getStatus() {
    return {
      status: this.status,
      connected: this.status === 'connected',
      qr: this.currentQr,
      qrDataUrl: this.currentQrDataUrl,
      pairingCode: this.currentPairingCode,
      pairingNumber: this.currentPairingNumber,
      connectedNumber: this.connectedNumber,
      connectedName: this.connectedName,
      lastDisconnectReason: this.lastDisconnectReason,
      uptimeSeconds: this.connectionStartTime ? Math.floor((Date.now() - this.connectionStartTime) / 1000) : 0,
      sessionId: this.status === 'connected' ? sessionManager.exportSessionId() : null,
    };
  }

  public setQr(qr: string, dataUrl: string) {
    this.currentQr = qr;
    this.currentQrDataUrl = dataUrl;
    if (this.status !== 'connected' && this.status !== 'code_ready') {
      this.status = 'qr_ready';
    }
  }

  public setConnected(user: any) {
    this.status = 'connected';
    this.currentQr = null;
    this.currentQrDataUrl = null;
    this.currentPairingCode = null;
    this.connectionStartTime = Date.now();
    const botJid = user?.id || '';
    this.connectedNumber = botJid.split('@')[0].split(':')[0] || null;
    this.connectedName = user?.name || botConfig.get().BOT_NAME;
  }

  public setDisconnected(reason?: any) {
    this.status = 'disconnected';
    this.connectionStartTime = null;
    this.lastDisconnectReason = reason ? String(reason) : null;
  }

  public async requestPairingCode(phoneNumber: string): Promise<string> {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanNumber || cleanNumber.length < 8 || cleanNumber.length > 16) {
      throw new Error('Please enter a valid international phone number with country code (e.g. 15551234567 or 2348012345678).');
    }

    if (this.status === 'connected') {
      throw new Error(`Already connected as +${this.connectedNumber}. Unlink first to pair a new number.`);
    }

    if (!this.sock) {
      botConfig.update({ PAIRING_CODE_NUMBER: cleanNumber });
      await this.start();
    }

    try {
      logger.info({ number: cleanNumber }, 'Requesting WhatsApp pairing code from socket...');
      let code = await this.sock!.requestPairingCode(cleanNumber);
      code = code?.match(/.{1,4}/g)?.join('-') || code;

      this.currentPairingCode = code;
      this.currentPairingNumber = cleanNumber;
      this.status = 'code_ready';

      console.log('\n' + chalk.yellow.bold('════════════════════════════════════════════════'));
      console.log(chalk.cyan.bold(`  WEB REQUESTED PAIRING CODE: ${chalk.green.bold(code)}`));
      console.log(chalk.yellow.bold('════════════════════════════════════════════════\n'));

      return code;
    } catch (err: any) {
      logger.error({ err }, 'Failed to request pairing code');
      throw new Error(err?.message || 'Failed to generate pairing code. Please make sure phone number is correct.');
    }
  }

  public async start(): Promise<WASocket> {
    if (this.isConnecting) {
      if (this.sock) return this.sock;
      throw new Error('Connection already in progress');
    }
    this.isConnecting = true;
    this.status = 'connecting';

    // Restore session credentials if SESSION_ID is supplied in env
    sessionManager.restoreSessionFromEnv();

    const { state, saveCreds } = await useMultiFileAuthState(sessionManager.getSessionDir());
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info({ version, isLatest }, 'Using Baileys version');

    // Create Baileys Socket
    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }), // Suppress internal Baileys noise
      printQRInTerminal: false, // Handled custom in connection.update
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      browser: ['Fredrik', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
    });

    this.sock = sock;

    // Handle Pairing Code if requested and not yet registered
    const config = botConfig.get();
    if (config.PAIRING_CODE_NUMBER && !state.creds.registered) {
      const cleanNumber = config.PAIRING_CODE_NUMBER.replace(/[^0-9]/g, '');
      logger.info({ number: cleanNumber }, 'Requesting WhatsApp pairing code...');

      setTimeout(async () => {
        try {
          let code = await sock.requestPairingCode(cleanNumber);
          code = code?.match(/.{1,4}/g)?.join('-') || code;
          this.currentPairingCode = code;
          this.currentPairingNumber = cleanNumber;
          this.status = 'code_ready';
          console.log('\n' + chalk.yellow.bold('════════════════════════════════════════════════'));
          console.log(chalk.cyan.bold(`  FREDRIK PAIRING CODE: ${chalk.green.bold(code)}`));
          console.log(chalk.yellow.bold('════════════════════════════════════════════════\n'));
        } catch (err) {
          logger.error({ err }, 'Failed to generate pairing code');
        }
      }, 3000);
    }

    // Bind Event Listeners
    sock.ev.on('connection.update', (update) => {
      handleConnectionUpdate(sock, update, () => this.reconnect());
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', (upsert) => {
      handleMessagesUpsert(sock, upsert);
    });

    sock.ev.on('messages.update', (updates) => {
      handleMessagesUpdate(sock, updates);
    });

    sock.ev.on('call', (calls) => {
      handleCall(sock, calls);
    });

    sock.ev.on('group-participants.update', (update) => {
      handleGroupParticipantsUpdate(sock, update);
    });

    this.isConnecting = false;
    return sock;
  }

  public async reconnect(): Promise<void> {
    if (this.isConnecting) return;

    if (this.sock) {
      try {
        (this.sock.ev as any).removeAllListeners?.('connection.update');
        (this.sock.ev as any).removeAllListeners?.('creds.update');
        (this.sock.ev as any).removeAllListeners?.('messages.upsert');
        (this.sock.ev as any).removeAllListeners?.('messages.update');
        (this.sock.ev as any).removeAllListeners?.('call');
        (this.sock.ev as any).removeAllListeners?.('group-participants.update');
        this.sock.end(undefined);
      } catch {
        // Ignore termination errors
      }
      this.sock = null;
    }
    this.isConnecting = false;
    await this.start();
  }

  public async stop(): Promise<void> {
    if (this.sock) {
      try {
        (this.sock.ev as any).removeAllListeners?.('connection.update');
        (this.sock.ev as any).removeAllListeners?.('creds.update');
        (this.sock.ev as any).removeAllListeners?.('messages.upsert');
        (this.sock.ev as any).removeAllListeners?.('messages.update');
        (this.sock.ev as any).removeAllListeners?.('call');
        (this.sock.ev as any).removeAllListeners?.('group-participants.update');
        this.sock.end(undefined);
      } catch {}
      this.sock = null;
    }
  }

  public async logout(): Promise<void> {
    logger.info('Logging out and clearing session...');
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch {}
    }
    await this.stop();
    sessionManager.clearSession();
    this.status = 'disconnected';
    this.currentQr = null;
    this.currentQrDataUrl = null;
    this.currentPairingCode = null;
    this.currentPairingNumber = null;
    this.connectedNumber = null;
    this.connectedName = null;
    this.connectionStartTime = null;

    // Automatically reboot a clean socket for pairing
    setTimeout(async () => {
      try {
        await this.start();
      } catch (err) {
        logger.error({ err }, 'Failed to start clean socket after logout');
      }
    }, 1000);
  }
}

export const whatsappClient = new WhatsAppClient();
export default whatsappClient;
