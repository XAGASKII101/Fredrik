import { WASocket } from '@whiskeysockets/baileys';
import moderationService from '../services/moderationService.js';

export async function handleCall(sock: WASocket, calls: any[]): Promise<void> {
  await moderationService.handleCall(sock, calls);
}
