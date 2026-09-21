import cron from 'node-cron';
import db from '../database/index.js';
import logger from './logger.js';
import type { WASocket } from '@whiskeysockets/baileys';

export class Scheduler {
  private sock: WASocket | null = null;
  private isRunning = false;

  public init(sock: WASocket): void {
    this.sock = sock;
    if (this.isRunning) return;
    this.isRunning = true;

    // Check reminders every 15 seconds
    cron.schedule('*/15 * * * * *', async () => {
      await this.checkReminders();
    });

    // Daily morning automated status at 07:30 AM
    cron.schedule('30 7 * * *', async () => {
      await this.postDailyMorningStatus();
    });

    logger.info('Task scheduler initialized with daily automation');
  }

  private async postDailyMorningStatus(): Promise<void> {
    if (!this.sock) return;
    const isEnabled = db.getSetting<boolean>('autoDailyStatus', false);
    if (!isEnabled) return;

    const morningQuotes = [
      'Good morning Lord! ✨ Grateful for another beautiful day to grow, achieve, and inspire.',
      'Rise and shine! 🌅 "Every new beginning comes from some other beginning’s end." Have a blessed day!',
      'Good morning! ☕ Start today with a positive mindset, focus on your goals, and make it happen.',
      'Blessings for this new morning! 🌟 Keep your head high, trust the journey, and enjoy the day.',
    ];

    const quote = morningQuotes[Math.floor(Math.random() * morningQuotes.length)];

    try {
      await this.sock.sendMessage(
        'status@broadcast',
        { text: quote },
        { backgroundColor: '#1B5E20', font: 2 } as any
      );
      logger.info('Automated morning status posted successfully');
    } catch (err) {
      logger.error({ err }, 'Failed to post automated morning status');
    }
  }

  private async checkReminders(): Promise<void> {
    if (!this.sock) return;
    const now = Date.now();
    const pending = db.getPendingReminders();

    for (const reminder of pending) {
      if (reminder.time <= now) {
        try {
          await this.sock.sendMessage(reminder.jid, {
            text: `⏰ *FREDRIK REMINDER*\n\nHey! Here is your scheduled reminder:\n📌 *${reminder.text}*`,
          });
          db.completeReminder(reminder.id);
          logger.info({ id: reminder.id, jid: reminder.jid }, 'Reminder delivered successfully');
        } catch (err) {
          logger.error({ err, id: reminder.id }, 'Failed to deliver reminder');
        }
      }
    }
  }
}

export const scheduler = new Scheduler();
export default scheduler;
