import { Command } from '../../lib/commandRegistry.js';
import db from '../../database/index.js';
import botConfig from '../../config/index.js';

export const moderationCommands: Command[] = [
  {
    name: 'antilink',
    description: 'Toggle anti-link protection in the group',
    category: 'moderation',
    groupOnly: true,
    adminOnly: true,
    usage: 'antilink <on|off>',
    execute: async (ctx) => {
      const mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = db.getGroup(ctx.chat).antilink;
        await ctx.reply(`🛡️ *Anti-Link Protection*\nCurrent status: *${current ? 'ON' : 'OFF'}*\nUsage: \`${ctx.prefix}antilink on\` or \`${ctx.prefix}antilink off\``);
        return;
      }

      const enabled = mode === 'on';
      db.updateGroup(ctx.chat, { antilink: enabled });
      await ctx.reply(`🛡️ Anti-link protection is now *${enabled ? 'ENABLED' : 'DISABLED'}*.`);
    },
  },
  {
    name: 'antidelete',
    description: 'Toggle anti-delete message notification in the group',
    category: 'moderation',
    groupOnly: true,
    adminOnly: true,
    usage: 'antidelete <on|off>',
    execute: async (ctx) => {
      const mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = db.getGroup(ctx.chat).antidelete;
        await ctx.reply(`🗑️ *Anti-Delete Notification*\nCurrent status: *${current ? 'ON' : 'OFF'}*\nUsage: \`${ctx.prefix}antidelete on\` or \`${ctx.prefix}antidelete off\``);
        return;
      }

      const enabled = mode === 'on';
      db.updateGroup(ctx.chat, { antidelete: enabled });
      await ctx.reply(`🗑️ Anti-delete notification is now *${enabled ? 'ENABLED' : 'DISABLED'}*.`);
    },
  },
  {
    name: 'antispam',
    description: 'Toggle anti-spam rate limiting in the group',
    category: 'moderation',
    groupOnly: true,
    adminOnly: true,
    usage: 'antispam <on|off>',
    execute: async (ctx) => {
      const mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = db.getGroup(ctx.chat).antispam;
        await ctx.reply(`🚫 *Anti-Spam Filter*\nCurrent status: *${current ? 'ON' : 'OFF'}*\nUsage: \`${ctx.prefix}antispam on\` or \`${ctx.prefix}antispam off\``);
        return;
      }

      const enabled = mode === 'on';
      db.updateGroup(ctx.chat, { antispam: enabled });
      await ctx.reply(`🚫 Anti-spam protection is now *${enabled ? 'ENABLED' : 'DISABLED'}*.`);
    },
  },
  {
    name: 'anticall',
    description: 'Toggle global anti-call auto rejection',
    category: 'moderation',
    ownerOnly: true,
    usage: 'anticall <on|off>',
    execute: async (ctx) => {
      const mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = botConfig.get().ANTI_CALL;
        await ctx.reply(`📞 *Anti-Call Auto-Reject*\nCurrent status: *${current ? 'ON' : 'OFF'}*\nUsage: \`${ctx.prefix}anticall on\` or \`${ctx.prefix}anticall off\``);
        return;
      }

      const enabled = mode === 'on';
      botConfig.update({ ANTI_CALL: enabled });
      await ctx.reply(`📞 Anti-call auto-reject is now *${enabled ? 'ENABLED' : 'DISABLED'}*.`);
    },
  },
  {
    name: 'vv',
    description: 'Retrieve and bypass view-once photo or video',
    category: 'moderation',
    aliases: ['retrieve', 'viewonce'],
    usage: 'vv (reply to view-once media)',
    execute: async (ctx) => {
      const quoted = ctx.quoted?.message;
      const isViewOnce =
        quoted?.viewOnceMessage ||
        quoted?.viewOnceMessageV2 ||
        quoted?.viewOnceMessageV2Extension;

      if (!isViewOnce && !ctx.quoted?.isMedia) {
        await ctx.reply(`👁️ Please reply to a View-Once photo or video with \`${ctx.prefix}vv\`.`);
        return;
      }

      await ctx.react('👁️');
      const buffer = await ctx.downloadMedia();
      if (!buffer) {
        await ctx.reply('❌ Could not retrieve view-once media.');
        return;
      }

      if (ctx.quoted?.mediaType === 'video') {
        await ctx.sock.sendMessage(ctx.chat, {
          video: buffer,
          caption: '🔓 Unlocked View-Once video',
        }, { quoted: ctx.msg });
      } else {
        await ctx.sock.sendMessage(ctx.chat, {
          image: buffer,
          caption: '🔓 Unlocked View-Once photo',
        }, { quoted: ctx.msg });
      }
    },
  },
];
