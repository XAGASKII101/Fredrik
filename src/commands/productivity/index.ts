import { Command } from '../../lib/commandRegistry.js';
import db from '../../database/index.js';
import axios from 'axios';

export const productivityCommands: Command[] = [
  {
    name: 'remind',
    description: 'Set a reminder (e.g. 10m, 2h, 1d)',
    category: 'productivity',
    aliases: ['reminder', 'alarm'],
    usage: 'remind <duration: 10m/2h> <reminder text>',
    execute: async (ctx) => {
      const parts = ctx.args;
      if (parts.length < 2) {
        await ctx.reply(`⏰ *Fredrik Reminder*\nUsage: \`${ctx.prefix}remind 15m Call John\`\nSupported units: s (seconds), m (minutes), h (hours), d (days)`);
        return;
      }

      const timeStr = parts[0];
      const reminderText = parts.slice(1).join(' ');

      const match = timeStr.match(/^(\d+)([smhd])$/i);
      if (!match) {
        await ctx.reply(`⚠️ Invalid time format. Use e.g. \`10s\`, \`15m\`, \`2h\`, \`1d\``);
        return;
      }

      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      let ms = 0;
      if (unit === 's') ms = val * 1000;
      else if (unit === 'm') ms = val * 60 * 1000;
      else if (unit === 'h') ms = val * 60 * 60 * 1000;
      else if (unit === 'd') ms = val * 24 * 60 * 60 * 1000;

      const targetTime = Date.now() + ms;
      const id = Math.random().toString(36).substring(2, 9);

      db.addReminder({
        id,
        jid: ctx.chat,
        time: targetTime,
        text: reminderText,
        completed: false,
      });

      await ctx.reply(`⏰ *Reminder Set!*\nI will remind you about "*${reminderText}*" in *${timeStr}*.`);
    },
  },
  {
    name: 'todo',
    description: 'Manage your personal to-do list',
    category: 'productivity',
    aliases: ['todos'],
    usage: 'todo [add <task> | list | clear]',
    execute: async (ctx) => {
      const action = ctx.args[0]?.toLowerCase();
      const user = db.getUser(ctx.sender);

      if (action === 'add') {
        const item = ctx.args.slice(1).join(' ');
        if (!item) {
          await ctx.reply(`Usage: \`${ctx.prefix}todo add Finish project documentation\``);
          return;
        }
        const updated = [...user.notes, item];
        db.updateUser(ctx.sender, { notes: updated });
        await ctx.reply(`✅ Added to your to-do list:\n"_${item}_"`);
      } else if (action === 'clear') {
        db.updateUser(ctx.sender, { notes: [] });
        await ctx.reply(`🧹 Your to-do list has been cleared.`);
      } else {
        // list
        if (user.notes.length === 0) {
          await ctx.reply(`📝 Your to-do list is currently empty.\nAdd an item with \`${ctx.prefix}todo add <task>\`.`);
          return;
        }

        let list = `📋 *YOUR TO-DO LIST:*\n\n`;
        user.notes.forEach((task, index) => {
          list += `${index + 1}. ${task}\n`;
        });
        list += `\n_Clear all with \`${ctx.prefix}todo clear\`_`;
        await ctx.reply(list);
      }
    },
  },
  {
    name: 'calc',
    description: 'Perform a math calculation',
    category: 'utilities',
    aliases: ['calculate', 'math'],
    usage: 'calc 25 * 4 + 10',
    execute: async (ctx) => {
      if (!ctx.text) {
        await ctx.reply(`🧮 Usage: \`${ctx.prefix}calc (15 * 8) / 2\``);
        return;
      }

      // Safe calculation without arbitrary eval
      try {
        const sanitized = ctx.text.replace(/[^0-9+\-*/().%^ ]/g, '');
        if (!sanitized) {
          await ctx.reply('❌ Invalid mathematical characters.');
          return;
        }
        // Use Function with restricted scope
        const result = new Function(`'use strict'; return (${sanitized})`)();
        await ctx.reply(`🧮 *Result:*\n\`${sanitized}\` = *${result}*`);
      } catch (err: any) {
        await ctx.reply(`❌ Calculation error: ${err.message}`);
      }
    },
  },
  {
    name: 'weather',
    description: 'Get weather forecast for a city',
    category: 'utilities',
    usage: 'weather London',
    execute: async (ctx) => {
      const city = ctx.text || 'London';
      try {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 10000 });
        const current = res.data?.current_condition?.[0];
        if (!current) {
          await ctx.reply(`❌ Could not fetch weather for ${city}.`);
          return;
        }

        const tempC = current.temp_C;
        const tempF = current.temp_F;
        const desc = current.weatherDesc?.[0]?.value || 'Clear';
        const humidity = current.humidity;
        const wind = current.windspeedKmph;

        let msg = `🌤️ *Weather in ${city.toUpperCase()}*\n\n`;
        msg += `🌡️ *Temperature:* ${tempC}°C (${tempF}°F)\n`;
        msg += `☁️ *Condition:* ${desc}\n`;
        msg += `💧 *Humidity:* ${humidity}%\n`;
        msg += `💨 *Wind:* ${wind} km/h\n`;

        await ctx.reply(msg);
      } catch (err) {
        await ctx.reply(`❌ Weather data currently unavailable for "${city}".`);
      }
    },
  },
  {
    name: 'qr',
    description: 'Generate a QR code image from text',
    category: 'utilities',
    usage: 'qr <text or link>',
    execute: async (ctx) => {
      if (!ctx.text) {
        await ctx.reply(`📱 Usage: \`${ctx.prefix}qr https://example.com\``);
        return;
      }

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(ctx.text)}`;
      try {
        const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
        await ctx.sock.sendMessage(ctx.chat, {
          image: Buffer.from(response.data),
          caption: `📱 *QR Code generated for:*\n${ctx.text}`,
        }, { quoted: ctx.msg });
      } catch (err: any) {
        await ctx.reply(`❌ Failed to generate QR code: ${err.message}`);
      }
    },
  },
];
