import {
  proto,
  WASocket,
  downloadMediaMessage,
  GroupMetadata,
  AnyMessageContent,
  MiscMessageGenerationOptions,
} from '@whiskeysockets/baileys';
import botConfig from '../config/index.js';
import logger from './logger.js';

/**
 * Recursively unwraps ephemeral, view-once, and document wrapped messages
 */
export function unwrapMessage(m: proto.IMessage | null | undefined): proto.IMessage | null | undefined {
  if (!m) return m;
  if (m.ephemeralMessage?.message) return unwrapMessage(m.ephemeralMessage.message);
  if (m.viewOnceMessage?.message) return unwrapMessage(m.viewOnceMessage.message);
  if (m.viewOnceMessageV2?.message) return unwrapMessage(m.viewOnceMessageV2.message);
  if (m.viewOnceMessageV2Extension?.message) return unwrapMessage(m.viewOnceMessageV2Extension.message);
  if (m.documentWithCaptionMessage?.message) return unwrapMessage(m.documentWithCaptionMessage.message);
  return m;
}

export interface QuotedMessageInfo {
  key: proto.IMessageKey;
  message?: proto.IMessage | null;
  text?: string;
  sender: string;
  isMedia: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'sticker' | 'document';
}

export class FredrikContext {
  public sock: WASocket;
  public msg: proto.IWebMessageInfo;
  public chat: string;
  public sender: string;
  public senderNumber: string;
  public isGroup: boolean;
  public isOwner: boolean = false;
  public isAdmin: boolean = false;
  public isBotAdmin: boolean = false;
  public body: string = '';
  public prefix: string = '.';
  public command: string = '';
  public args: string[] = [];
  public text: string = '';
  public quoted: QuotedMessageInfo | null = null;
  public groupMetadata: GroupMetadata | null = null;
  public unwrappedMessage: proto.IMessage | null = null;

  constructor(sock: WASocket, msg: proto.IWebMessageInfo) {
    this.sock = sock;
    this.msg = msg;
    this.chat = msg.key.remoteJid || '';
    this.sender = msg.key.participant || msg.key.remoteJid || '';
    this.senderNumber = this.sender.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    this.isGroup = this.chat.endsWith('@g.us');
    this.unwrappedMessage = unwrapMessage(msg.message) || null;
    this.extractBodyAndCommand();
    this.extractQuotedMessage();
  }

  /**
   * Resolve sender and bot admin permissions in groups
   */
  public async resolvePermissions(): Promise<void> {
    const config = botConfig.get();

    // Check owner
    if (this.msg.key.fromMe === true) {
      this.isOwner = true;
    } else if (config.OWNER_NUMBER === 'auto') {
      const botJid = this.sock.user?.id || '';
      const botPhone = botJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      this.isOwner = Boolean(botPhone && this.senderNumber === botPhone);
    } else {
      const cleanOwner = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
      this.isOwner = Boolean(cleanOwner && this.senderNumber === cleanOwner);
    }

    if (this.isGroup) {
      try {
        this.groupMetadata = await this.sock.groupMetadata(this.chat);
        const participants = this.groupMetadata?.participants || [];

        const userParticipant = participants.find((p) => p.id === this.sender || p.id.startsWith(this.senderNumber));
        this.isAdmin = userParticipant?.admin === 'admin' || userParticipant?.admin === 'superadmin' || this.isOwner;

        const botJid = this.sock.user?.id || '';
        const botPhone = botJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        const botParticipant = participants.find((p) => p.id === botJid || p.id.startsWith(botPhone));
        this.isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      } catch (err) {
        logger.debug({ err, chat: this.chat }, 'Could not resolve group metadata');
      }
    }
  }

  private extractBodyAndCommand(): void {
    const m = this.unwrappedMessage;
    if (!m) return;

    // Determine message text body across all possible WhatsApp message types
    this.body =
      m.conversation ||
      m.extendedTextMessage?.text ||
      m.imageMessage?.caption ||
      m.videoMessage?.caption ||
      m.documentMessage?.caption ||
      m.buttonsResponseMessage?.selectedButtonId ||
      m.listResponseMessage?.singleSelectReply?.selectedRowId ||
      m.templateButtonReplyMessage?.selectedId ||
      (m as any).interactiveResponseMessage?.body?.text ||
      '';

    this.body = this.body.trim();
    const configPrefix = botConfig.get().PREFIX || '.';
    this.prefix = configPrefix;

    const supportedPrefixes = Array.from(new Set([configPrefix, '.', '/', '!', '#'])).filter(Boolean);
    const matchedPrefix = supportedPrefixes.find((p) => this.body.startsWith(p));

    if (matchedPrefix) {
      this.prefix = matchedPrefix;
      const withoutPrefix = this.body.slice(matchedPrefix.length).trim();
      const parts = withoutPrefix.split(/\s+/);
      this.command = (parts[0] || '').toLowerCase();
      this.args = parts.slice(1);
      this.text = this.args.join(' ');
    } else {
      // Also allow direct universal keywords without prefix
      const firstWord = this.body.split(/\s+/)[0]?.toLowerCase();
      if (['menu', 'help', 'ping', 'alive', 'stats', 'uptime'].includes(firstWord)) {
        this.command = firstWord;
        this.prefix = configPrefix;
        this.args = this.body.split(/\s+/).slice(1);
        this.text = this.args.join(' ');
      }
    }
  }

  private extractQuotedMessage(): void {
    const m = this.unwrappedMessage;
    if (!m) return;

    const contextInfo =
      m.extendedTextMessage?.contextInfo ||
      m.imageMessage?.contextInfo ||
      m.videoMessage?.contextInfo ||
      m.stickerMessage?.contextInfo ||
      m.documentMessage?.contextInfo;

    if (!contextInfo || !contextInfo.quotedMessage) return;

    const qMsgRaw = contextInfo.quotedMessage;
    const qMsg = unwrapMessage(qMsgRaw) || qMsgRaw;
    const qSender = contextInfo.participant || '';

    let mediaType: 'image' | 'video' | 'audio' | 'sticker' | 'document' | undefined;
    let isMedia = false;

    if (qMsg.imageMessage) {
      isMedia = true;
      mediaType = 'image';
    } else if (qMsg.videoMessage) {
      isMedia = true;
      mediaType = 'video';
    } else if (qMsg.audioMessage) {
      isMedia = true;
      mediaType = 'audio';
    } else if (qMsg.stickerMessage) {
      isMedia = true;
      mediaType = 'sticker';
    } else if (qMsg.documentMessage) {
      isMedia = true;
      mediaType = 'document';
    }

    const qText =
      qMsg.conversation ||
      qMsg.extendedTextMessage?.text ||
      qMsg.imageMessage?.caption ||
      qMsg.videoMessage?.caption ||
      '';

    this.quoted = {
      key: {
        remoteJid: this.chat,
        id: contextInfo.stanzaId,
        participant: qSender,
      },
      message: qMsg,
      text: qText,
      sender: qSender,
      isMedia,
      mediaType,
    };
  }

  /**
   * Send text reply to current message
   */
  public async reply(
    text: string,
    options?: { mentions?: string[] }
  ): Promise<any> {
    return this.sock.sendMessage(
      this.chat,
      { text, mentions: options?.mentions },
      { quoted: this.msg }
    );
  }

  /**
   * React with emoji to current message
   */
  public async react(emoji: string): Promise<any> {
    return this.sock.sendMessage(this.chat, {
      react: {
        text: emoji,
        key: this.msg.key,
      },
    });
  }

  /**
   * Send media (image, video, sticker, audio)
   */
  public async sendMedia(
    content: AnyMessageContent,
    options?: MiscMessageGenerationOptions
  ): Promise<any> {
    return this.sock.sendMessage(this.chat, content, { quoted: this.msg, ...options });
  }

  /**
   * Download media from either the current message or quoted message
   */
  public async downloadMedia(): Promise<Buffer | null> {
    try {
      // Check quoted message first
      if (this.quoted && this.quoted.isMedia && this.quoted.message) {
        const buffer = await downloadMediaMessage(
          {
            key: this.quoted.key,
            message: this.quoted.message,
          },
          'buffer',
          {}
        );
        return buffer as Buffer;
      }

      // Check current message
      const m = this.unwrappedMessage;
      if (m?.imageMessage || m?.videoMessage || m?.audioMessage || m?.stickerMessage || m?.documentMessage) {
        const buffer = await downloadMediaMessage(
          {
            key: this.msg.key,
            message: m,
          },
          'buffer',
          {}
        );
        return buffer as Buffer;
      }

      return null;
    } catch (err) {
      logger.error({ err }, 'Error downloading media from message');
      return null;
    }
  }
}
