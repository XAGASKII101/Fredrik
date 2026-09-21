import { WASocket, ParticipantAction } from '@whiskeysockets/baileys';
import db from '../database/index.js';
import logger from '../lib/logger.js';

export async function handleGroupParticipantsUpdate(
  sock: WASocket,
  update: { id: string; participants: string[]; action: ParticipantAction | string }
): Promise<void> {
  const { id, participants, action } = update;
  const group = db.getGroup(id);

  if (action === 'add' && group.welcomeMessage) {
    for (const participant of participants) {
      try {
        const text = group.welcomeMessage.replace(/@user/g, `@${participant.split('@')[0]}`);
        await sock.sendMessage(id, {
          text,
          mentions: [participant],
        });
      } catch (err) {
        logger.error({ err }, 'Failed to send welcome message');
      }
    }
  } else if (action === 'remove' && group.goodbyeMessage) {
    for (const participant of participants) {
      try {
        const text = group.goodbyeMessage.replace(/@user/g, `@${participant.split('@')[0]}`);
        await sock.sendMessage(id, {
          text,
          mentions: [participant],
        });
      } catch (err) {
        logger.error({ err }, 'Failed to send goodbye message');
      }
    }
  }
}
