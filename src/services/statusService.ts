import type { WASocket, proto } from '@whiskeysockets/baileys';
import botConfig from '../config/index.js';
import db from '../database/index.js';
import logger from '../lib/logger.js';

export class StatusService {
  /**
   * Handle incoming broadcast status messages
   */
  public async handleStatusUpdate(sock: WASocket, message: proto.IWebMessageInfo): Promise<void> {
    const config = botConfig.get();
    const key = message.key;

    if (key.remoteJid !== 'status@broadcast') return;

    // Auto-view status
    if (config.AUTO_VIEW_STATUS && key.id) {
      try {
        await sock.readMessages([key]);
        logger.debug({ sender: key.participant, id: key.id }, 'Auto-viewed status');
      } catch (err) {
        logger.error({ err }, 'Failed to mark status as viewed');
      }
    }

    // Auto-react to status with customizable emoji
    const isAutoReactEnabled = db.getSetting('autoReactStatus', config.AUTO_REACT_STATUS);
    if (isAutoReactEnabled && key.id && key.participant) {
      try {
        const customEmoji = db.getSetting<string>('statusReactionEmoji', '💚');

        await sock.sendMessage(
          'status@broadcast',
          {
            react: {
              text: customEmoji,
              key: key,
            },
          },
          { statusJidList: [key.participant] }
        );
        logger.debug({ sender: key.participant, emoji: customEmoji }, 'Auto-reacted to status');
      } catch (err) {
        logger.error({ err }, 'Failed to auto-react to status');
      }
    }
  }

  /**
   * Post text status to WhatsApp status story
   */
  public async postStatusText(sock: WASocket, text: string, backgroundColor: string = '#2E7D32'): Promise<void> {
    await sock.sendMessage(
      'status@broadcast',
      {
        text,
      },
      {
        backgroundColor,
        font: 2,
      } as any
    );
    logger.info({ text }, 'Posted text status to WhatsApp');
  }

  /**
   * Post image or video status to WhatsApp status story
   */
  public async postStatusMedia(sock: WASocket, mediaBuffer: Buffer, type: 'image' | 'video', caption?: string): Promise<void> {
    if (type === 'image') {
      await sock.sendMessage(
        'status@broadcast',
        {
          image: mediaBuffer,
          caption,
        }
      );
    } else {
      await sock.sendMessage(
        'status@broadcast',
        {
          video: mediaBuffer,
          caption,
        }
      );
    }
    logger.info({ type, caption }, 'Posted media status to WhatsApp');
  }
}

export const statusService = new StatusService();
export default statusService;
