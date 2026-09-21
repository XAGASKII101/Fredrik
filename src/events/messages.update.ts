import { WASocket, WAMessageUpdate } from '@whiskeysockets/baileys';
import moderationService from '../services/moderationService.js';

export async function handleMessagesUpdate(sock: WASocket, updates: WAMessageUpdate[]): Promise<void> {
  for (const update of updates) {
    // Check if message was revoked (deleted for everyone)
    if (update.update.message === null && update.key.remoteJid && update.key.id) {
      await moderationService.handleDeletedMessage(sock, update.key.remoteJid, update.key.id);
    }
  }
}
