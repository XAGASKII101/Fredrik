import { AntiAbuseManager } from '../src/lib/antiAbuse.js';

describe('AntiAbuseManager', () => {
  let manager: AntiAbuseManager;

  beforeEach(() => {
    manager = new AntiAbuseManager();
  });

  it('should enforce command cooldowns', () => {
    const userId = '1234567890';
    const cmd = 'ai';

    // First call: 0 cooldown
    const firstCall = manager.checkCooldown(userId, cmd, 5);
    expect(firstCall).toBe(0);

    // Immediate second call: cooldown active
    const secondCall = manager.checkCooldown(userId, cmd, 5);
    expect(secondCall).toBeGreaterThan(0);
    expect(secondCall).toBeLessThanOrEqual(5);
  });

  it('should reset cooldowns when requested', () => {
    const userId = '1234567890';
    const cmd = 'ai';

    manager.checkCooldown(userId, cmd, 5);
    manager.resetCooldowns(userId);

    const callAfterReset = manager.checkCooldown(userId, cmd, 5);
    expect(callAfterReset).toBe(0);
  });

  it('should rate limit excessive requests', () => {
    const userId = 'spammer_user';

    for (let i = 0; i < 30; i++) {
      manager.isRateLimited(userId);
    }

    // 31st request should trigger rate limiting / temporary ban
    const isLimited = manager.isRateLimited(userId);
    expect(isLimited).toBe(true);
  });
});
