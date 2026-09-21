import { WASocket, proto, downloadMediaMessage } from '@whiskeysockets/baileys';
import botConfig from '../config/index.js';
import db from '../database/index.js';
import logger from '../lib/logger.js';
import { unwrapMessage } from '../lib/context.js';

interface CachedMessage {
  jid: string;
  sender: string;
  message: proto.IMessage;
  mediaBuffer?: Buffer | null;
  mediaType?: 'image' | 'video' | 'audio' | 'sticker' | 'document';
  timestamp: number;
}

export class ModerationService {
  // Store recent messages for Anti-Delete (max 1500 messages)
  private messageCache: Map<string, CachedMessage> = new Map();

  /**
   * Cache message and its media (if any) for anti-delete recovery
   */
  public async cacheMessage(sock: WASocket, key: proto.IMessageKey, rawMessage: proto.IMessage): Promise<void> {
    if (!key.id || !key.remoteJid) return;

    const unwrapped = unwrapMessage(rawMessage) || rawMessage;
    let mediaType: 'image' | 'video' | 'audio' | 'sticker' | 'document' | undefined;
    let mediaBuffer: Buffer | null = null;

    if (unwrapped.imageMessage) mediaType = 'image';
    else if (unwrapped.videoMessage) mediaType = 'video';
    else if (unwrapped.audioMessage) mediaType = 'audio';
    else if (unwrapped.stickerMessage) mediaType = 'sticker';
    else if (unwrapped.documentMessage) mediaType = 'document';

    // Download media buffer proactively if media exists so it survives message revocation
    if (mediaType && unwrapped) {
      try {
        const buf = await downloadMediaMessage(
          { key, message: unwrapped },
          'buffer',
          {}
        );
        mediaBuffer = buf as Buffer;
      } catch {
        // Ignore pre-download failure
      }
    }

    this.messageCache.set(key.id, {
      jid: key.remoteJid,
      sender: key.participant || key.remoteJid,
      message: unwrapped,
      mediaBuffer,
      mediaType,
      timestamp: Date.now(),
    });

    // Prune old cache entries
    if (this.messageCache.size > 1500) {
      const oldestKeys = Array.from(this.messageCache.keys()).slice(0, 300);
      for (const k of oldestKeys) {
        this.messageCache.delete(k);
      }
    }
  }

  public getCachedMessage(id: string): CachedMessage | undefined {
    return this.messageCache.get(id);
  }

  /**
   * Check for prohibited WhatsApp group invite links
   */
  public hasInviteLink(text: string): boolean {
    if (!text) return false;
    const linkRegex = /(chat\.whatsapp\.com\/[A-Za-z0-9]{20,24}|whatsapp\.com\/channel\/[A-Za-z0-9]{20,28})/i;
    return linkRegex.test(text);
  }

  /**
   * Handle anti-call rejection
   */
  public async handleCall(sock: WASocket, callEvents: any[]): Promise<void> {
    if (!botConfig.get().ANTI_CALL) return;

    for (const call of callEvents) {
      if (call.status === 'offer') {
        try {
          await (sock as any).rejectCall(call.id, call.from);
          logger.info({ caller: call.from, id: call.id }, 'Rejected incoming call');

          await sock.sendMessage(call.from, {
            text: `⚠️ *Fredrik Bot Notice*\nCalls are automatically rejected by system policy. Please send a text message instead.`,
          });
        } catch (err) {
          logger.error({ err }, 'Failed to reject call');
        }
      }
    }
  }

  /**
   * Handle deleted message: ALWAYS forward directly to OWNER's DM, not that person's DM
   */
  public async handleDeletedMessage(sock: WASocket, remoteJid: string, messageId: string): Promise<void> {
    if (!botConfig.get().ANTI_DELETE) return;

    const cached = this.getCachedMessage(messageId);
    if (!cached) return;

    const ownerJid = botConfig.getOwnerJid(sock);
    if (!ownerJid) {
      logger.warn('No owner JID found to forward deleted message');
      return;
    }

    try {
      const senderNumber = cached.sender.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      const isGroup = remoteJid.endsWith('@g.us');
      let originName = isGroup ? `Group (${remoteJid})` : `Private DM (+${senderNumber})`;

      if (isGroup) {
        try {
          const meta = await sock.groupMetadata(remoteJid);
          originName = `Group "${meta.subject}"`;
        } catch {}
      }

      let caption =
        `🗑️ *DELETED MESSAGE INTERCEPTED*\n\n` +
        `👤 *Sender:* @${senderNumber}\n` +
        `📍 *Origin:* ${originName}\n` +
        `⏰ *Time:* ${new Date(cached.timestamp).toLocaleTimeString()}\n`;

      const msg = cached.message;
      const text =
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption;

      if (text) {
        caption += `\n💬 *Deleted Content:*\n${text}`;
      }

      // Forward directly to OWNER's DM
      if (cached.mediaBuffer && cached.mediaType) {
        if (cached.mediaType === 'image') {
          await sock.sendMessage(ownerJid, {
            image: cached.mediaBuffer,
            caption,
            mentions: [cached.sender],
          });
        } else if (cached.mediaType === 'video') {
          await sock.sendMessage(ownerJid, {
            video: cached.mediaBuffer,
            caption,
            mentions: [cached.sender],
          });
        } else if (cached.mediaType === 'audio') {
          await sock.sendMessage(ownerJid, { text: caption, mentions: [cached.sender] });
          await sock.sendMessage(ownerJid, { audio: cached.mediaBuffer, mimetype: 'audio/mp4', ptt: true });
        } else if (cached.mediaType === 'sticker') {
          await sock.sendMessage(ownerJid, { text: caption, mentions: [cached.sender] });
          await sock.sendMessage(ownerJid, { sticker: cached.mediaBuffer });
        } else {
          await sock.sendMessage(ownerJid, {
            document: cached.mediaBuffer,
            mimetype: 'application/octet-stream',
            fileName: 'deleted_file',
            caption,
            mentions: [cached.sender],
          });
        }
      } else {
        await sock.sendMessage(ownerJid, {
          text: caption,
          mentions: [cached.sender],
        });
      }

      logger.info({ sender: senderNumber, origin: originName }, 'Forwarded deleted message to owner DM');
    } catch (err) {
      logger.error({ err }, 'Failed to forward deleted message to owner DM');
    }
  }

  /**
   * Automatically intercept any View-Once message and forward to OWNER's DM
   */
  public async handleViewOnce(sock: WASocket, msg: proto.IWebMessageInfo): Promise<void> {
    const raw = msg.message;
    if (!raw) return;

    // Check if this message is a view-once message
    const isViewOnce =
      raw.viewOnceMessage ||
      raw.viewOnceMessageV2 ||
      raw.viewOnceMessageV2Extension ||
      raw.imageMessage?.viewOnce ||
      raw.videoMessage?.viewOnce ||
      raw.audioMessage?.viewOnce;

    if (!isViewOnce) return;

    const ownerJid = botConfig.getOwnerJid(sock);
    if (!ownerJid) return;

    const unwrapped = unwrapMessage(raw) || raw;
    const sender = msg.key.participant || msg.key.remoteJid || '';
    const senderNumber = sender.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

    // Don't forward view-once sent by owner to owner
    if (msg.key.fromMe || sender === ownerJid) return;

    try {
      const isGroup = msg.key.remoteJid?.endsWith('@g.us');
      let originName = isGroup ? `Group (${msg.key.remoteJid})` : `Private DM (+${senderNumber})`;

      if (isGroup && msg.key.remoteJid) {
        try {
          const meta = await sock.groupMetadata(msg.key.remoteJid);
          originName = `Group "${meta.subject}"`;
        } catch {}
      }

      const captionText =
        unwrapped.imageMessage?.caption ||
        unwrapped.videoMessage?.caption ||
        '';

      let header =
        `👁️ *AUTOMATIC VIEW-ONCE INTERCEPTED*\n\n` +
        `👤 *Sender:* @${senderNumber}\n` +
        `📍 *Origin:* ${originName}\n` +
        `⏰ *Time:* ${new Date().toLocaleTimeString()}\n`;

      if (captionText) {
        header += `💬 *Caption:* ${captionText}\n`;
      }

      // Download the view-once media buffer
      const buffer = await downloadMediaMessage(
        { key: msg.key, message: unwrapped },
        'buffer',
        {}
      );

      if (!buffer) {
        logger.warn('Could not download view-once buffer for owner forward');
        return;
      }

      // Forward directly to OWNER's DM
      if (unwrapped.imageMessage) {
        await sock.sendMessage(ownerJid, {
          image: buffer as Buffer,
          caption: header,
          mentions: [sender],
        });
      } else if (unwrapped.videoMessage) {
        await sock.sendMessage(ownerJid, {
          video: buffer as Buffer,
          caption: header,
          mentions: [sender],
        });
      } else if (unwrapped.audioMessage) {
        await sock.sendMessage(ownerJid, { text: header, mentions: [sender] });
        await sock.sendMessage(ownerJid, { audio: buffer as Buffer, mimetype: 'audio/mp4', ptt: true });
      }

      logger.info({ sender: senderNumber, origin: originName }, 'Successfully forwarded View-Once media to owner DM');
    } catch (err) {
      logger.error({ err }, 'Failed to intercept and forward view-once message');
    }
  }
}

export const moderationService = new ModerationService();
export default moderationService;
