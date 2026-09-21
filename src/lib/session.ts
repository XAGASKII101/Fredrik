import fs from 'fs';
import path from 'path';
import logger from './logger.js';
import botConfig from '../config/index.js';

export class SessionManager {
  private sessionDir: string;

  constructor() {
    this.sessionDir = path.resolve(process.cwd(), 'session');
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  public getSessionDir(): string {
    return this.sessionDir;
  }

  /**
   * If a SESSION_ID env variable is provided (e.g. base64-encoded creds.json), restore it
   */
  public restoreSessionFromEnv(): boolean {
    const sessionId = botConfig.get().SESSION_ID;
    if (!sessionId || sessionId.trim() === '') {
      return false;
    }

    const credsPath = path.join(this.sessionDir, 'creds.json');
    if (fs.existsSync(credsPath)) {
      logger.info('Existing credentials file found in session directory');
      return true;
    }

    try {
      let cleaned = sessionId.trim();
      // Remove any prefix like "Fredrik~" or "session~"
      if (cleaned.includes('~')) {
        cleaned = cleaned.split('~')[1];
      }

      const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
      // Validate JSON
      JSON.parse(decoded);
      fs.writeFileSync(credsPath, decoded, 'utf-8');
      logger.info('Successfully restored session credentials from SESSION_ID');
      return true;
    } catch (err) {
      logger.error({ err }, 'Failed to decode or parse SESSION_ID');
      return false;
    }
  }

  /**
   * Export current creds.json as base64 string for safe backup or deployment
   */
  public exportSessionId(): string | null {
    const credsPath = path.join(this.sessionDir, 'creds.json');
    if (!fs.existsSync(credsPath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(credsPath, 'utf-8');
      const base64 = Buffer.from(data).toString('base64');
      return `Fredrik~${base64}`;
    } catch (err) {
      logger.error({ err }, 'Failed to export session credentials');
      return null;
    }
  }

  public clearSession(): void {
    try {
      if (fs.existsSync(this.sessionDir)) {
        fs.rmSync(this.sessionDir, { recursive: true, force: true });
        fs.mkdirSync(this.sessionDir, { recursive: true });
        logger.info('Session directory cleared');
      }
    } catch (err) {
      logger.error({ err }, 'Error clearing session directory');
    }
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
