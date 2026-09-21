import dotenv from 'dotenv';
import { z } from 'zod';
import { APP_CONSTANTS } from './constants.js';

dotenv.config();

const configSchema = z.object({
  SESSION_ID: z.string().default(''),
  PAIRING_CODE_NUMBER: z.string().optional().default(''),
  BOT_NAME: z.string().default(APP_CONSTANTS.BOT_NAME),
  PREFIX: z.string().default(APP_CONSTANTS.DEFAULT_PREFIX),
  OWNER_NUMBER: z.string().default('auto'),
  MODE: z.enum(['public', 'private', 'group', 'inbox']).default('public'),

  // OpenRouter AI
  OPENROUTER_API_KEY: z.string().default(''),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4o'),
  OPENROUTER_SITE_URL: z.string().default('https://github.com/fredrik-bot'),
  OPENROUTER_SITE_NAME: z.string().default('Fredrik WhatsApp Bot'),

  // Server & Monitoring
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default('info'),
  TIMEZONE: z.string().default('Africa/Lagos'),

  // Automation & Protection
  ANTI_LINK: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  ANTI_SPAM: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  ANTI_DELETE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  ANTI_CALL: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  AUTO_READ: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  AUTO_VIEW_STATUS: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  AUTO_REACT_STATUS: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  // Media
  STICKER_PACK_NAME: z.string().default(APP_CONSTANTS.EXIF.PACK),
  STICKER_AUTHOR: z.string().default(APP_CONSTANTS.EXIF.AUTHOR),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
});

export type Config = z.infer<typeof configSchema>;

class ConfigManager {
  private config: Config;

  constructor() {
    this.config = configSchema.parse(process.env);
  }

  public get(): Config {
    return this.config;
  }

  public update(partial: Partial<Config>): void {
    this.config = configSchema.parse({
      ...this.config,
      ...partial,
    });
  }

  public setOwnerNumber(number: string): void {
    const cleaned = number.replace(/[^0-9]/g, '');
    this.config.OWNER_NUMBER = cleaned;
  }

  public isOwner(jid: string, sock?: any): boolean {
    if (!jid) return false;
    const phone = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    let configuredOwner = this.config.OWNER_NUMBER;
    if (configuredOwner === 'auto') {
      const botId = sock?.user?.id;
      if (botId) {
        configuredOwner = botId.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      } else {
        return true; // Default allow if owner is not yet determined
      }
    }
    const clean = configuredOwner.replace(/[^0-9]/g, '');
    return phone === clean;
  }

  public getOwnerJid(sock?: any): string | null {
    let num = this.config.OWNER_NUMBER;
    if (!num || num === 'auto') {
      const botId = sock?.user?.id;
      if (botId) {
        num = botId.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      }
    }
    if (num && num !== 'auto') {
      const clean = num.replace(/[^0-9]/g, '');
      return `${clean}@s.whatsapp.net`;
    }
    return null;
  }
}

export const botConfig = new ConfigManager();
export default botConfig;
