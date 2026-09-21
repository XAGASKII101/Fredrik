import { Command } from '../../lib/commandRegistry.js';
import statusService from '../../services/statusService.js';
import db from '../../database/index.js';

export const statusCommands: Command[] = [
  {
    name: 'poststatus',
    description: 'Post text or replied media directly to your WhatsApp Status story',
    category: 'owner',
    ownerOnly: true,
    aliases: ['statuspost', 'setstatus'],
    usage: 'poststatus <text> (or reply to image/video)',
    execute: async (ctx) => {
      const m = ctx.unwrappedMessage || ctx.msg.message;
      const isMediaQuoted = ctx.quoted?.isMedia;
      const isMediaDirect = !!m?.imageMessage || !!m?.videoMessage;

      // If media is attached or quoted
      if (isMediaQuoted || isMediaDirect) {
        await ctx.react('⏳');
        const buffer = await ctx.downloadMedia();
        if (!buffer) {
          await ctx.reply('❌ Failed to download media for status.');
          return;
        }

        const isVideo = ctx.quoted?.mediaType === 'video' || !!m?.videoMessage;
        const caption = ctx.text || '';

        try {
          await statusService.postStatusMedia(ctx.sock, buffer, isVideo ? 'video' : 'image', caption);
          await ctx.reply('✅ Media status story posted successfully!');
          await ctx.react('✅');
        } catch (err: any) {
          await ctx.reply(`❌ Failed to post status: ${err.message}`);
        }
        return;
      }

      // If text status
      if (!ctx.text) {
        await ctx.reply(`📸 *WhatsApp Status Poster*\nUsage: \`${ctx.prefix}poststatus Good morning everyone! ✨\`\nOr reply to a photo/video with \`${ctx.prefix}poststatus [caption]\``);
        return;
      }

      await ctx.react('⏳');
      try {
        await statusService.postStatusText(ctx.sock, ctx.text);
        await ctx.reply('✅ Text status story posted successfully!');
        await ctx.react('✅');
      } catch (err: any) {
        await ctx.reply(`❌ Failed to post status: ${err.message}`);
      }
    },
  },
  {
    name: 'statusreact',
    description: 'Configure auto-react emoji for status updates',
    category: 'owner',
    ownerOnly: true,
    aliases: ['setreact'],
    usage: 'statusreact <emoji or on/off>',
    execute: async (ctx) => {
      const arg = ctx.args[0];
      if (!arg) {
        const currentEmoji = db.getSetting<string>('statusReactionEmoji', '💚');
        const isEnabled = db.getSetting<boolean>('autoReactStatus', true);
        await ctx.reply(`📸 *Status Auto-React*\nStatus: *${isEnabled ? 'ENABLED' : 'DISABLED'}*\nCurrent Emoji: ${currentEmoji}\n\nTo change emoji: \`${ctx.prefix}statusreact ❤️\`\nTo toggle: \`${ctx.prefix}statusreact on\` or \`off\``);
        return;
      }

      if (arg.toLowerCase() === 'on') {
        db.setSetting('autoReactStatus', true);
        await ctx.reply('✅ Status auto-reaction is now *ENABLED*.');
        return;
      }

      if (arg.toLowerCase() === 'off') {
        db.setSetting('autoReactStatus', false);
        await ctx.reply('🚫 Status auto-reaction is now *DISABLED*.');
        return;
      }

      // Set custom emoji
      db.setSetting('autoReactStatus', true);
      db.setSetting('statusReactionEmoji', arg);
      await ctx.reply(`✅ Status auto-react emoji updated to: ${arg}`);
    },
  },
  {
    name: 'autostatus',
    description: 'Toggle automated daily morning status posts',
    category: 'owner',
    ownerOnly: true,
    usage: 'autostatus <on/off>',
    execute: async (ctx) => {
      const mode = ctx.args[0]?.toLowerCase();
      if (mode !== 'on' && mode !== 'off') {
        const current = db.getSetting<boolean>('autoDailyStatus', false);
        await ctx.reply(`🌅 *Daily Automated Status*\nCurrent status: *${current ? 'ON' : 'OFF'}*\nUsage: \`${ctx.prefix}autostatus on\` or \`${ctx.prefix}autostatus off\``);
        return;
      }

      const enabled = mode === 'on';
      db.setSetting('autoDailyStatus', enabled);
      await ctx.reply(`🌅 Daily automated status is now *${enabled ? 'ENABLED' : 'DISABLED'}*. (Posts daily uplifting morning messages)`);
    },
  },
];
