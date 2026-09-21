import { Command } from '../../lib/commandRegistry.js';
import db from '../../database/index.js';

export const groupCommands: Command[] = [
  {
    name: 'kick',
    description: 'Remove a member from the group',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: 'kick @user (or reply to user)',
    execute: async (ctx) => {
      const target = ctx.quoted?.sender || ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        await ctx.reply(`⚠️ Please mention or reply to the user you want to remove.`);
        return;
      }

      try {
        await ctx.sock.groupParticipantsUpdate(ctx.chat, [target], 'remove');
        await ctx.reply(`✅ Successfully removed @${target.split('@')[0]}`, {
          mentions: [target],
        });
      } catch (err: any) {
        await ctx.reply(`❌ Failed to remove user: ${err.message}`);
      }
    },
  },
  {
    name: 'add',
    description: 'Add a user to the group',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: 'add 1234567890',
    execute: async (ctx) => {
      const number = ctx.args[0]?.replace(/[^0-9]/g, '');
      if (!number) {
        await ctx.reply(`⚠️ Usage: \`${ctx.prefix}add 2348012345678\``);
        return;
      }

      const targetJid = `${number}@s.whatsapp.net`;
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.chat, [targetJid], 'add');
        await ctx.reply(`✅ Added ${number} to the group.`);
      } catch (err: any) {
        await ctx.reply(`❌ Failed to add user: ${err.message}`);
      }
    },
  },
  {
    name: 'promote',
    description: 'Promote a group member to admin',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: 'promote @user',
    execute: async (ctx) => {
      const target = ctx.quoted?.sender || ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        await ctx.reply(`⚠️ Please mention or reply to the user to promote.`);
        return;
      }

      try {
        await ctx.sock.groupParticipantsUpdate(ctx.chat, [target], 'promote');
        await ctx.reply(`🛡️ Promoted @${target.split('@')[0]} to admin.`, {
          mentions: [target],
        });
      } catch (err: any) {
        await ctx.reply(`❌ Failed to promote: ${err.message}`);
      }
    },
  },
  {
    name: 'demote',
    description: 'Demote an admin to normal member',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    usage: 'demote @admin',
    execute: async (ctx) => {
      const target = ctx.quoted?.sender || ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        await ctx.reply(`⚠️ Please mention or reply to the admin to demote.`);
        return;
      }

      try {
        await ctx.sock.groupParticipantsUpdate(ctx.chat, [target], 'demote');
        await ctx.reply(`⬇️ Demoted @${target.split('@')[0]} to member.`, {
          mentions: [target],
        });
      } catch (err: any) {
        await ctx.reply(`❌ Failed to demote: ${err.message}`);
      }
    },
  },
  {
    name: 'tagall',
    description: 'Mention all group members',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    aliases: ['everyone', 'hidetag'],
    usage: 'tagall [announcement message]',
    execute: async (ctx) => {
      const meta = ctx.groupMetadata || (await ctx.sock.groupMetadata(ctx.chat));
      const participants = meta.participants || [];
      const mentions = participants.map((p) => p.id);

      const messageText = ctx.text || 'Attention everyone!';
      let text = `📢 *GROUP ANNOUNCEMENT*\n\n${messageText}\n\n`;
      text += `👥 *Members (${participants.length}):*\n`;

      for (const p of participants) {
        text += `• @${p.id.split('@')[0]}\n`;
      }

      await ctx.sock.sendMessage(ctx.chat, {
        text,
        mentions,
      }, { quoted: ctx.msg });
    },
  },
  {
    name: 'groupinfo',
    description: 'Get details about the current group',
    category: 'group',
    groupOnly: true,
    aliases: ['ginfo'],
    execute: async (ctx) => {
      const meta = ctx.groupMetadata || (await ctx.sock.groupMetadata(ctx.chat));
      const admins = meta.participants.filter((p) => p.admin).map((p) => `@${p.id.split('@')[0]}`);

      let info = `🏷️ *GROUP INFORMATION*\n\n`;
      info += `📌 *Name:* ${meta.subject}\n`;
      info += `🆔 *ID:* \`${meta.id}\`\n`;
      info += `👥 *Members:* ${meta.participants.length}\n`;
      info += `👑 *Creator:* @${meta.owner?.split('@')[0] || 'Unknown'}\n`;
      info += `🛡️ *Admins:* ${admins.join(', ')}\n\n`;
      if (meta.desc) {
        info += `📝 *Description:*\n${meta.desc}\n`;
      }

      await ctx.reply(info, {
        mentions: meta.participants.filter((p) => p.admin).map((p) => p.id),
      });
    },
  },
  {
    name: 'link',
    description: 'Get the group invite link',
    category: 'group',
    groupOnly: true,
    botAdminRequired: true,
    aliases: ['grouplink'],
    execute: async (ctx) => {
      try {
        const code = await ctx.sock.groupInviteCode(ctx.chat);
        await ctx.reply(`🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}`);
      } catch (err: any) {
        await ctx.reply(`❌ Could not retrieve invite link: ${err.message}`);
      }
    },
  },
  {
    name: 'mute',
    description: 'Restrict group so only admins can send messages',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    aliases: ['close'],
    execute: async (ctx) => {
      try {
        await ctx.sock.groupSettingUpdate(ctx.chat, 'announcement');
        await ctx.reply('🔒 Group is now muted. Only admins can send messages.');
      } catch (err: any) {
        await ctx.reply(`❌ Failed to mute group: ${err.message}`);
      }
    },
  },
  {
    name: 'unmute',
    description: 'Allow all members to send messages in the group',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    botAdminRequired: true,
    aliases: ['open'],
    execute: async (ctx) => {
      try {
        await ctx.sock.groupSettingUpdate(ctx.chat, 'not_announcement');
        await ctx.reply('🔓 Group is now unmuted. All members can send messages.');
      } catch (err: any) {
        await ctx.reply(`❌ Failed to unmute group: ${err.message}`);
      }
    },
  },
  {
    name: 'warn',
    description: 'Issue a warning to a member (3 warnings = kick)',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    usage: 'warn @user [reason]',
    execute: async (ctx) => {
      const target = ctx.quoted?.sender || ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        await ctx.reply(`⚠️ Please mention or reply to the user to warn.`);
        return;
      }

      const user = db.getUser(target);
      const newWarnings = user.warnings + 1;
      db.updateUser(target, { warnings: newWarnings });

      const reason = ctx.text || 'Breaking group rules';

      if (newWarnings >= 3) {
        await ctx.reply(
          `⚠️ @${target.split('@')[0]} has accumulated 3 warnings and is being removed.\nReason: ${reason}`,
          { mentions: [target] }
        );
        db.updateUser(target, { warnings: 0 }); // Reset warnings
        if (ctx.isBotAdmin) {
          await ctx.sock.groupParticipantsUpdate(ctx.chat, [target], 'remove');
        }
      } else {
        await ctx.reply(
          `⚠️ *Warning Issued*\n👤 User: @${target.split('@')[0]}\n📊 Warnings: [${newWarnings}/3]\n📌 Reason: ${reason}`,
          { mentions: [target] }
        );
      }
    },
  },
  {
    name: 'unwarn',
    description: 'Reset warnings for a user',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    usage: 'unwarn @user',
    execute: async (ctx) => {
      const target = ctx.quoted?.sender || ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        await ctx.reply(`⚠️ Please mention or reply to the user.`);
        return;
      }

      db.updateUser(target, { warnings: 0 });
      await ctx.reply(`✅ Warnings reset to 0 for @${target.split('@')[0]}`, {
        mentions: [target],
      });
    },
  },
];
