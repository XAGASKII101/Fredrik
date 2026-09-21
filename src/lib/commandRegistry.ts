import { FredrikContext } from './context.js';
import botConfig from '../config/index.js';

export type CommandCategory =
  | 'ai'
  | 'media'
  | 'group'
  | 'moderation'
  | 'productivity'
  | 'utilities'
  | 'games'
  | 'owner'
  | 'info';

export interface Command {
  name: string;
  description: string;
  category: CommandCategory;
  aliases?: string[];
  usage?: string;
  cooldown?: number; // In seconds
  ownerOnly?: boolean;
  adminOnly?: boolean;
  groupOnly?: boolean;
  botAdminRequired?: boolean;
  execute: (ctx: FredrikContext) => Promise<void>;
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private aliases: Map<string, string> = new Map();

  public register(cmd: Command): void {
    const lowerName = cmd.name.toLowerCase();
    this.commands.set(lowerName, cmd);

    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        this.aliases.set(alias.toLowerCase(), lowerName);
      }
    }
  }

  public get(nameOrAlias: string): Command | undefined {
    const lower = nameOrAlias.toLowerCase();
    if (this.commands.has(lower)) {
      return this.commands.get(lower);
    }
    const realName = this.aliases.get(lower);
    if (realName) {
      return this.commands.get(realName);
    }
    return undefined;
  }

  public getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  public getByCategory(category: CommandCategory): Command[] {
    return this.getAll().filter((c) => c.category === category);
  }

  public generateMenu(): string {
    const config = botConfig.get();
    const prefix = config.PREFIX || '.';
    const botName = config.BOT_NAME || 'Fredrik';

    const categoryIcons: Record<CommandCategory, string> = {
      ai: '🧠 AI & Assistance',
      media: '🎬 Stickers & Media',
      group: '👥 Group Moderation',
      moderation: '🛡️ Safety & Protection',
      productivity: '⏰ Productivity & Tasks',
      utilities: '🛠️ Utilities & Tools',
      games: '🎮 Games & Entertainment',
      owner: '👑 Owner Controls',
      info: 'ℹ️ System & Stats',
    };

    let menu = `╭━━━〔 *${botName.toUpperCase()} BOT* 〕━━━╮\n`;
    menu += `┃ ⚡ *Mode:* ${config.MODE.toUpperCase()}\n`;
    menu += `┃ 🔣 *Prefix:* [ ${prefix} ]\n`;
    menu += `┃ 🧠 *AI Engine:* Free GPT-4o\n`;
    menu += `╰━━━━━━━━━━━━━━━━━━╯\n\n`;

    const categories: CommandCategory[] = [
      'ai',
      'media',
      'group',
      'moderation',
      'productivity',
      'utilities',
      'games',
      'owner',
      'info',
    ];

    for (const cat of categories) {
      const cmds = this.getByCategory(cat);
      if (cmds.length === 0) continue;

      menu += `┌─── *${categoryIcons[cat]}* ───\n`;
      for (const cmd of cmds) {
        menu += `│ • \`${prefix}${cmd.name}\` : ${cmd.description}\n`;
      }
      menu += `└───────────────────────\n\n`;
    }

    menu += `💡 _Tip: Reply to an image/video with \`${prefix}s\` to make a sticker!_`;
    return menu;
  }

  public generateHelp(commandName: string): string | null {
    const cmd = this.get(commandName);
    if (!cmd) return null;

    const prefix = botConfig.get().PREFIX;
    let help = `📌 *COMMAND INFO: ${prefix}${cmd.name}*\n\n`;
    help += `📝 *Description:* ${cmd.description}\n`;
    help += `🏷️ *Category:* ${cmd.category.toUpperCase()}\n`;
    if (cmd.aliases && cmd.aliases.length > 0) {
      help += `🔁 *Aliases:* ${cmd.aliases.map((a) => `\`${prefix}${a}\``).join(', ')}\n`;
    }
    help += `💡 *Usage:* \`${prefix}${cmd.usage || cmd.name}\`\n`;
    if (cmd.cooldown) {
      help += `⏱️ *Cooldown:* ${cmd.cooldown}s\n`;
    }
    if (cmd.ownerOnly) help += `🔒 *Restricted:* Owner Only\n`;
    if (cmd.adminOnly) help += `🛡️ *Restricted:* Group Admin Only\n`;

    return help;
  }
}

export const commandRegistry = new CommandRegistry();
export default commandRegistry;
