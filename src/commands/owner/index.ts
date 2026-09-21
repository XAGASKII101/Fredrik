import { Command } from '../../lib/commandRegistry.js';
import botConfig from '../../config/index.js';
import util from 'util';

export const ownerCommands: Command[] = [
  {
    name: 'broadcast',
    description: 'Broadcast a message to all joined groups',
    category: 'owner',
    ownerOnly: true,
    aliases: ['bc'],
    usage: 'broadcast <message>',
    execute: async (ctx) => {
      if (!ctx.text) {
        await ctx.reply(`📢 Usage: \`${ctx.prefix}broadcast Hello everyone!\``);
        return;
      }

      await ctx.reply('⏳ Fetching groups and sending broadcast...');
      try {
        const chats = await ctx.sock.groupFetchAllParticipating();
        const groupJids = Object.keys(chats);

        let successCount = 0;
        const broadcastText = `📢 *FREDRIK BROADCAST*\n\n${ctx.text}\n\n_— Broadcast from Bot Owner_`;

        for (const jid of groupJids) {
          try {
            await ctx.sock.sendMessage(jid, { text: broadcastText });
            successCount++;
            // Safe delay to prevent flooding
            await new Promise((res) => setTimeout(res, 1200));
          } catch {
            // Ignore single group failure
          }
        }

        await ctx.reply(`✅ Broadcast delivered to ${successCount}/${groupJids.length} groups.`);
      } catch (err: any) {
        await ctx.reply(`❌ Broadcast failed: ${err.message}`);
      }
    },
  },
  {
    name: 'mode',
    description: 'Set bot operation mode (public, private, group, inbox)',
    category: 'owner',
    ownerOnly: true,
    usage: 'mode <public|private|group|inbox>',
    execute: async (ctx) => {
      const mode = ctx.args[0]?.toLowerCase() as any;
      const allowed = ['public', 'private', 'group', 'inbox'];

      if (!mode || !allowed.includes(mode)) {
        await ctx.reply(`⚙️ Current mode: *${botConfig.get().MODE}*\nAvailable modes: ${allowed.map((m) => `\`${m}\``).join(', ')}`);
        return;
      }

      botConfig.update({ MODE: mode });
      await ctx.reply(`✅ Bot mode updated to *${mode.toUpperCase()}*.`);
    },
  },
  {
    name: 'setprefix',
    description: 'Change the command prefix',
    category: 'owner',
    ownerOnly: true,
    usage: 'setprefix <symbol>',
    execute: async (ctx) => {
      const newPrefix = ctx.args[0];
      if (!newPrefix) {
        await ctx.reply(`⚙️ Current prefix: \`${botConfig.get().PREFIX}\``);
        return;
      }

      botConfig.update({ PREFIX: newPrefix });
      await ctx.reply(`✅ Command prefix updated to: \`${newPrefix}\``);
    },
  },
  {
    name: 'settings',
    description: 'View and toggle bot features',
    category: 'owner',
    ownerOnly: true,
    execute: async (ctx) => {
      const c = botConfig.get();
      let text = `⚙️ *FREDRIK SYSTEM SETTINGS*\n\n`;
      text += `🤖 *Bot Name:* ${c.BOT_NAME}\n`;
      text += `🔣 *Prefix:* \`${c.PREFIX}\`\n`;
      text += `🌐 *Mode:* ${c.MODE}\n`;
      text += `🧠 *AI Model:* ${c.OPENROUTER_MODEL}\n`;
      text += `🛡️ *Anti-Link:* ${c.ANTI_LINK ? '✅ ON' : '❌ OFF'}\n`;
      text += `🗑️ *Anti-Delete:* ${c.ANTI_DELETE ? '✅ ON' : '❌ OFF'}\n`;
      text += `🚫 *Anti-Spam:* ${c.ANTI_SPAM ? '✅ ON' : '❌ OFF'}\n`;
      text += `📞 *Anti-Call:* ${c.ANTI_CALL ? '✅ ON' : '❌ OFF'}\n`;
      text += `👁️ *Auto-View Status:* ${c.AUTO_VIEW_STATUS ? '✅ ON' : '❌ OFF'}\n`;
      text += `\n_Toggle features with \`${c.PREFIX}antilink\`, \`${c.PREFIX}antidelete\`, etc._`;

      await ctx.reply(text);
    },
  },
  {
    name: 'eval',
    description: 'Evaluate JavaScript code (Owner only)',
    category: 'owner',
    ownerOnly: true,
    usage: 'eval <code>',
    execute: async (ctx) => {
      if (!ctx.text) {
        await ctx.reply(`Usage: \`${ctx.prefix}eval 2 + 2\``);
        return;
      }

      try {
        let evaluated = await eval(ctx.text);
        if (typeof evaluated !== 'string') {
          evaluated = util.inspect(evaluated, { depth: 1 });
        }
        await ctx.reply(`💻 *Eval Output:*\n\`\`\`${evaluated}\`\`\``);
      } catch (err: any) {
        await ctx.reply(`❌ *Eval Error:*\n\`\`\`${err.message}\`\`\``);
      }
    },
  },
  {
    name: 'restart',
    description: 'Safely reboot the bot process',
    category: 'owner',
    ownerOnly: true,
    execute: async (ctx) => {
      await ctx.reply('🔄 Restarting Fredrik bot process...');
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    },
  },
];
