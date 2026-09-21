import { CommandRegistry, Command } from '../src/lib/commandRegistry.js';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  it('should register and retrieve a command by name', () => {
    const testCmd: Command = {
      name: 'ping',
      description: 'Test ping command',
      category: 'info',
      execute: async () => {},
    };

    registry.register(testCmd);
    const found = registry.get('ping');
    expect(found).toBeDefined();
    expect(found?.name).toBe('ping');
  });

  it('should retrieve a command by alias', () => {
    const testCmd: Command = {
      name: 'sticker',
      description: 'Create a sticker',
      category: 'media',
      aliases: ['s', 'stick'],
      execute: async () => {},
    };

    registry.register(testCmd);
    expect(registry.get('s')?.name).toBe('sticker');
    expect(registry.get('stick')?.name).toBe('sticker');
  });

  it('should filter commands by category', () => {
    const cmd1: Command = {
      name: 'ai',
      description: 'AI chat',
      category: 'ai',
      execute: async () => {},
    };
    const cmd2: Command = {
      name: 'kick',
      description: 'Kick user',
      category: 'group',
      execute: async () => {},
    };

    registry.register(cmd1);
    registry.register(cmd2);

    const aiCmds = registry.getByCategory('ai');
    expect(aiCmds).toHaveLength(1);
    expect(aiCmds[0].name).toBe('ai');
  });

  it('should generate formatted help for command', () => {
    const cmd: Command = {
      name: 'calc',
      description: 'Calculate math',
      category: 'utilities',
      usage: 'calc 2+2',
      execute: async () => {},
    };

    registry.register(cmd);
    const help = registry.generateHelp('calc');
    expect(help).toContain('calc 2+2');
    expect(help).toContain('Calculate math');
  });
});
