import { APP_CONSTANTS } from '../config/constants.js';

interface RateLimitEntry {
  count: number;
  firstTimestamp: number;
  bannedUntil?: number;
}

export class AntiAbuseManager {
  private cooldowns: Map<string, number> = new Map();
  private rateLimits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if a command is on cooldown for a given user
   * @returns remaining seconds if on cooldown, 0 if free to run
   */
  public checkCooldown(userId: string, commandName: string, cooldownSeconds: number = APP_CONSTANTS.COOLDOWNS.DEFAULT_COMMAND_SECONDS): number {
    const key = `${userId}:${commandName}`;
    const now = Date.now();
    const expiry = this.cooldowns.get(key);

    if (expiry && now < expiry) {
      return Math.ceil((expiry - now) / 1000);
    }

    this.cooldowns.set(key, now + cooldownSeconds * 1000);
    return 0;
  }

  /**
   * Check if a user is flooding or spamming
   * @returns true if user is rate limited or temporarily banned
   */
  public isRateLimited(userId: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxAllowed = APP_CONSTANTS.RATE_LIMITS.MAX_MESSAGES_PER_MINUTE;

    const entry = this.rateLimits.get(userId);

    if (entry) {
      if (entry.bannedUntil && now < entry.bannedUntil) {
        return true;
      }

      if (now - entry.firstTimestamp < windowMs) {
        entry.count++;
        if (entry.count > maxAllowed) {
          entry.bannedUntil = now + APP_CONSTANTS.RATE_LIMITS.BAN_DURATION_MINUTES * 60 * 1000;
          return true;
        }
      } else {
        // Reset window
        this.rateLimits.set(userId, { count: 1, firstTimestamp: now });
      }
    } else {
      this.rateLimits.set(userId, { count: 1, firstTimestamp: now });
    }

    return false;
  }

  /**
   * Clear cooldowns for a user
   */
  public resetCooldowns(userId: string): void {
    for (const key of this.cooldowns.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cooldowns.delete(key);
      }
    }
  }
}

export const antiAbuse = new AntiAbuseManager();
export default antiAbuse;
