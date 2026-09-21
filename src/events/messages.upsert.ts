import { WASocket, proto } from '@whiskeysockets/baileys';
import { FredrikContext } from '../lib/context.js';
import commandRegistry from '../lib/commandRegistry.js';
import antiAbuse from '../lib/antiAbuse.js';
import moderationService from '../services/moderationService.js';
import statusService from '../services/statusService.js';
import botConfig from '../config/index.js';
import db from '../database/index.js';
import logger from '../lib/logger.js';
import chalk from 'chalk';

// Track startup time to safely ignore historical messages
const botStartTime = Math.floor(Date.now() / 1000) - 15;

// Cache processed message IDs to prevent duplicate execution & double texting
const processedMessageIds = new Set<string>();

export async function handleMessagesUpsert(
  sock: WASocket,
  upsert: { messages: proto.IWebMessageInfo[]; type: string }
): Promise<void> {
  const config = botConfig.get();

  for (const msg of upsert.messages) {
    if (!msg.message || !msg.key.id) continue;

    // Ignore historical messages that arrived before bot started
    const msgTime = Number(msg.messageTimestamp || 0);
    if (msgTime && msgTime < botStartTime) {
      continue;
    }

    // Deduplicate: If this message ID was already processed, skip immediately
    if (processedMessageIds.has(msg.key.id)) {
      continue;
    }
    processedMessageIds.add(msg.key.id);

    // Keep cache bounded
    if (processedMessageIds.size > 2500) {
      const firstItems = Array.from(processedMessageIds).slice(0, 500);
      for (const item of firstItems) {
        processedMessageIds.delete(item);
      }
    }

    // Handle Status Updates
    if (msg.key.remoteJid === 'status@broadcast') {
      await statusService.handleStatusUpdate(sock, msg);
      continue;
    }

    // Run view-once and anti-delete caching safely in background (do NOT block command execution)
    moderationService.handleViewOnce(sock, msg).catch((err) => {
      logger.debug({ err: err.message }, 'View-once handler error');
    });

    moderationService.cacheMessage(sock, msg.key, msg.message).catch((err) => {
      logger.debug({ err: err.message }, 'Cache message error');
    });

    // Auto-read if enabled
    if (config.AUTO_READ && !msg.key.fromMe) {
      sock.readMessages([msg.key]).catch(() => {});
    }

    const ctx = new FredrikContext(sock, msg);
    await ctx.resolvePermissions();

    // Group-level Moderation Checks
    if (ctx.isGroup) {
      const groupData = db.getGroup(ctx.chat);

      // 1. Anti-Link Filter
      if (groupData.antilink && moderationService.hasInviteLink(ctx.body)) {
        if (!ctx.isAdmin && !ctx.isOwner) {
          try {
            if (ctx.isBotAdmin) {
              await sock.sendMessage(ctx.chat, { delete: msg.key });
            }
            await ctx.reply(`⚠️ @${ctx.senderNumber} Links are not permitted in this group!`, {
              mentions: [ctx.sender],
            });
          } catch (err: any) {
            logger.error({ err: err.message }, 'Failed to execute anti-link deletion');
          }
          continue;
        }
      }
    }

    // Ignore messages with no command
    if (!ctx.command) {
      continue;
    }

    // Log detected command clearly to terminal
    console.log(
      chalk.cyan(`[COMMAND DETECTED] `) +
      chalk.yellow(`${ctx.prefix}${ctx.command}`) +
      chalk.gray(` from ${ctx.senderNumber} (${ctx.isGroup ? 'Group' : 'DM'})`)
    );

    // Anti-Spam Check (bypass for owner)
    if (!ctx.isOwner && antiAbuse.isRateLimited(ctx.sender)) {
      console.log(chalk.red(`[RATE LIMITED] User ${ctx.senderNumber} is rate limited.`));
      continue;
    }

    const cmd = commandRegistry.get(ctx.command);
    if (!cmd) {
      console.log(chalk.gray(`[UNKNOWN COMMAND] ${ctx.command}`));
      continue;
    }

    // Check Operating Mode restrictions
    if (config.MODE === 'private' && !ctx.isOwner) {
      continue;
    }
    if (config.MODE === 'group' && !ctx.isGroup && !ctx.isOwner) {
      continue;
    }
    if (config.MODE === 'inbox' && ctx.isGroup && !ctx.isOwner) {
      continue;
    }

    // Permission checks
    if (cmd.ownerOnly && !ctx.isOwner) {
      await ctx.reply('🔒 *Access Denied:* This command is restricted to the bot owner.');
      continue;
    }

    if (cmd.groupOnly && !ctx.isGroup) {
      await ctx.reply('👥 This command can only be used inside groups.');
      continue;
    }

    if (cmd.adminOnly && !ctx.isAdmin && !ctx.isOwner) {
      await ctx.reply('🛡️ *Admin Required:* You must be a group administrator to use this command.');
      continue;
    }

    if (cmd.botAdminRequired && !ctx.isBotAdmin) {
      await ctx.reply('⚠️ *Bot Admin Required:* Please make Fredrik an admin in this group to use this command.');
      continue;
    }

    // Cooldown check (skip for owner)
    if (!ctx.isOwner) {
      const remainingCooldown = antiAbuse.checkCooldown(ctx.sender, cmd.name, cmd.cooldown);
      if (remainingCooldown > 0) {
        await ctx.reply(`⏱️ Please wait *${remainingCooldown}s* before using \`${ctx.prefix}${cmd.name}\` again.`);
        continue;
      }
    }

    // Execute command with safe error trapping
    try {
      logger.info({ user: ctx.senderNumber, command: cmd.name, chat: ctx.chat }, 'Executing command');
      await cmd.execute(ctx);
      console.log(chalk.green(`[SUCCESS] Executed ${ctx.prefix}${cmd.name}`));
    } catch (err: any) {
      logger.error({ err, command: cmd.name }, 'Command execution error');
      console.error(chalk.red(`[ERROR] Command ${cmd.name} execution failed:`), err);
      await ctx.reply(`❌ *Command Execution Error:*\n${err.message || 'An unexpected error occurred.'}`);
    }
  }
}
