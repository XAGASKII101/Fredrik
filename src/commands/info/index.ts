import { Command, commandRegistry } from '../../lib/commandRegistry.js';
import botConfig from '../../config/index.js';
import os from 'os';

export const infoCommands: Command[] = [
  {
    name: 'menu',
    description: 'Show full categorized command list',
    category: 'info',
    aliases: ['help', 'commands', 'list'],
    execute: async (ctx) => {
      // If user typed e.g. `.help sticker`
      if (ctx.args[0]) {
        const cmdName = ctx.args[0].replace(ctx.prefix, '');
        const helpText = commandRegistry.generateHelp(cmdName);
        if (helpText) {
          await ctx.reply(helpText);
          return;
        }
      }

      const menuText = commandRegistry.generateMenu();
      await ctx.reply(menuText);
    },
  },
  {
    name: 'ping',
    description: 'Check bot responsiveness and network latency',
    category: 'info',
    aliases: ['p', 'speed'],
    execute: async (ctx) => {
      const start = Date.now();
      const reactStart = await ctx.react('🏓');
      const latency = Date.now() - start;
      await ctx.reply(`🏓 *Pong!*\n⚡ Latency: *${latency}ms*`);
    },
  },
  {
    name: 'uptime',
    description: 'Check how long Fredrik has been running',
    category: 'info',
    execute: async (ctx) => {
      const uptimeSec = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;

      await ctx.reply(
        `⏱️ *Fredrik Uptime:*\n*${hours} hours, ${minutes} minutes, ${seconds} seconds*`
      );
    },
  },
  {
    name: 'stats',
    description: 'Display server and bot system statistics',
    category: 'info',
    aliases: ['system', 'botstatus'],
    execute: async (ctx) => {
      const mem = process.memoryUsage();
      const rss = (mem.rss / 1024 / 1024).toFixed(1);
      const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(1);
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);

      let text = `📊 *FREDRIK SYSTEM METRICS*\n\n`;
      text += `🤖 *Bot:* ${botConfig.get().BOT_NAME} v1.0.0\n`;
      text += `💻 *Node.js:* ${process.version}\n`;
      text += `🖥️ *Platform:* ${os.platform()} (${os.arch()})\n`;
      text += `🧠 *Process RAM:* ${rss} MB (Heap: ${heapUsed} MB)\n`;
      text += `💽 *System RAM:* ${freeMem} GB free / ${totalMem} GB total\n`;
      text += `⚙️ *CPUs:* ${os.cpus().length} cores\n`;
      text += `⏱️ *Uptime:* ${Math.floor(process.uptime() / 60)} minutes\n`;

      await ctx.reply(text);
    },
  },
];
