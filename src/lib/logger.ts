import pino from 'pino';
import botConfig from '../config/index.js';

// Redact secret patterns like API keys, session tokens, passwords
const redactKeys = [
  'OPENROUTER_API_KEY',
  'SESSION_ID',
  'apiKey',
  'token',
  'authorization',
  'auth',
  'headers.Authorization',
  'headers.authorization',
];

export const logger = pino({
  level: botConfig.get().LOG_LEVEL || 'info',
  redact: {
    paths: redactKeys,
    censor: '[REDACTED_SECRET]',
  },
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
});

export default logger;
