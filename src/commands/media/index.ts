import { Command } from '../../lib/commandRegistry.js';
import mediaService from '../../services/mediaService.js';
import axios from 'axios';

export const mediaCommands: Command[] = [
  {
    name: 'sticker',
    description: 'Convert replied or sent image/video to a WhatsApp sticker',
    category: 'media',
    aliases: ['s', 'stick'],
    usage: 'sticker (reply to image or video)',
    cooldown: 4,
    execute: async (ctx) => {
      const isMediaQuoted = ctx.quoted?.isMedia;
      const m = ctx.unwrappedMessage || ctx.msg.message;
      const isMediaDirect =
        !!m?.imageMessage ||
        !!m?.videoMessage ||
        !!m?.stickerMessage;

      if (!isMediaQuoted && !isMediaDirect) {
        await ctx.reply(
          `🏷️ *Sticker Maker*\n` +
            `• Reply to an image with \`${ctx.prefix}s\` to make a photo sticker.\n` +
            `• Reply to a video/GIF with \`${ctx.prefix}s\` to make an animated sticker.`
        );
        return;
      }

      await ctx.react('⏳');
      const mediaBuffer = await ctx.downloadMedia();

      if (!mediaBuffer) {
        await ctx.reply('❌ Could not download media file.');
        return;
      }

      const isVideo =
        ctx.quoted?.mediaType === 'video' ||
        !!m?.videoMessage;

      try {
        let stickerBuffer: Buffer;
        if (isVideo) {
          stickerBuffer = await mediaService.videoToSticker(mediaBuffer);
        } else {
          stickerBuffer = await mediaService.imageToSticker(mediaBuffer);
        }

        await ctx.sock.sendMessage(ctx.chat, {
          sticker: stickerBuffer,
        }, { quoted: ctx.msg });

        await ctx.react('✅');
      } catch (err: any) {
        await ctx.reply(`❌ Sticker creation failed: ${err.message || 'Unknown error'}`);
      }
    },
  },
  {
    name: 'toimg',
    description: 'Convert a sticker into a standard image',
    category: 'media',
    aliases: ['photo', 'image'],
    usage: 'toimg (reply to sticker)',
    cooldown: 4,
    execute: async (ctx) => {
      const m = ctx.unwrappedMessage || ctx.msg.message;
      const isSticker = ctx.quoted?.mediaType === 'sticker' || !!m?.stickerMessage;

      if (!isSticker) {
        await ctx.reply(`🖼️ Please reply to a static sticker with \`${ctx.prefix}toimg\`.`);
        return;
      }

      await ctx.react('⏳');
      const buffer = await ctx.downloadMedia();
      if (!buffer) {
        await ctx.reply('❌ Failed to download sticker.');
        return;
      }

      try {
        const imageBuffer = await mediaService.stickerToImage(buffer);
        await ctx.sock.sendMessage(ctx.chat, {
          image: imageBuffer,
          caption: 'Here is your converted image.',
        }, { quoted: ctx.msg });
        await ctx.react('✅');
      } catch (err: any) {
        await ctx.reply(`❌ Conversion failed: ${err.message || 'Unknown error'}`);
      }
    },
  },
  {
    name: 'tovideo',
    description: 'Convert an animated sticker into a video',
    category: 'media',
    aliases: ['togif', 'tomp4'],
    usage: 'tovideo (reply to animated sticker)',
    cooldown: 5,
    execute: async (ctx) => {
      const m = ctx.unwrappedMessage || ctx.msg.message;
      const isSticker = ctx.quoted?.mediaType === 'sticker' || !!m?.stickerMessage;

      if (!isSticker) {
        await ctx.reply(`🎥 Please reply to an animated sticker with \`${ctx.prefix}tovideo\`.`);
        return;
      }

      await ctx.react('⏳');
      const buffer = await ctx.downloadMedia();
      if (!buffer) {
        await ctx.reply('❌ Failed to download sticker.');
        return;
      }

      try {
        const videoBuffer = await mediaService.stickerToVideo(buffer);
        await ctx.sock.sendMessage(ctx.chat, {
          video: videoBuffer,
          caption: 'Converted animated sticker to video.',
        }, { quoted: ctx.msg });
        await ctx.react('✅');
      } catch (err: any) {
        await ctx.reply(`❌ Conversion failed: ${err.message || 'Make sure the sticker is animated'}`);
      }
    },
  },
  {
    name: 'tts',
    description: 'Convert text to speech voice note',
    category: 'media',
    aliases: ['say', 'voice'],
    usage: 'tts <text> (or reply to text)',
    cooldown: 4,
    execute: async (ctx) => {
      const text = ctx.text || ctx.quoted?.text;
      if (!text) {
        await ctx.reply(`🔊 Usage: \`${ctx.prefix}tts Hello world\``);
        return;
      }

      await ctx.react('🔊');
      try {
        const audioBuffer = await mediaService.textToSpeech(text);
        await ctx.sock.sendMessage(
          ctx.chat,
          {
            audio: audioBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true, // Native WhatsApp voice note
          },
          { quoted: ctx.msg }
        );
      } catch (err: any) {
        await ctx.reply(`❌ Text-to-speech failed: ${err.message}`);
      }
    },
  },
  {
    name: 'ocr',
    description: 'Extract text from an image',
    category: 'media',
    aliases: ['readimg'],
    usage: 'ocr (reply to image)',
    cooldown: 5,
    execute: async (ctx) => {
      const m = ctx.unwrappedMessage || ctx.msg.message;
      const isImage = ctx.quoted?.mediaType === 'image' || !!m?.imageMessage;
      if (!isImage) {
        await ctx.reply(`📷 Please reply to an image with \`${ctx.prefix}ocr\` to read text from it.`);
        return;
      }

      await ctx.react('🔍');
      const buffer = await ctx.downloadMedia();
      if (!buffer) {
        await ctx.reply('❌ Could not download image.');
        return;
      }

      const text = await mediaService.ocr(buffer);
      await ctx.reply(`📝 *Extracted Text:*\n\n${text}`);
    },
  },
  {
    name: 'download',
    description: 'Download direct media file from URL',
    category: 'media',
    aliases: ['dl', 'get'],
    usage: 'download <url>',
    cooldown: 5,
    execute: async (ctx) => {
      const url = ctx.args[0];
      if (!url || !url.startsWith('http')) {
        await ctx.reply(`📥 Usage: \`${ctx.prefix}download https://example.com/file.mp4\``);
        return;
      }

      await ctx.react('⏳');
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 45000,
          maxContentLength: 50 * 1024 * 1024,
        });

        const contentType = String(response.headers['content-type'] || '');
        const buffer = Buffer.from(response.data);

        if (contentType.includes('image')) {
          await ctx.sock.sendMessage(ctx.chat, { image: buffer }, { quoted: ctx.msg });
        } else if (contentType.includes('video')) {
          await ctx.sock.sendMessage(ctx.chat, { video: buffer }, { quoted: ctx.msg });
        } else if (contentType.includes('audio')) {
          await ctx.sock.sendMessage(ctx.chat, { audio: buffer, mimetype: contentType }, { quoted: ctx.msg });
        } else {
          await ctx.sock.sendMessage(
            ctx.chat,
            {
              document: buffer,
              mimetype: contentType || 'application/octet-stream',
              fileName: 'downloaded_file',
            },
            { quoted: ctx.msg }
          );
        }
        await ctx.react('✅');
      } catch (err: any) {
        await ctx.reply(`❌ Download failed: ${err.message}`);
      }
    },
  },
  {
    name: 'getpp',
    description: 'Download profile picture of a user or group',
    category: 'media',
    aliases: ['pfp', 'profilepic'],
    usage: 'getpp [@user or in group]',
    cooldown: 4,
    execute: async (ctx) => {
      await ctx.react('🖼️');
      let targetJid = ctx.chat;

      const mentioned = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (ctx.quoted?.sender) {
        targetJid = ctx.quoted.sender;
      } else if (mentioned) {
        targetJid = mentioned;
      } else if (ctx.args[0]) {
        const clean = ctx.args[0].replace(/[^0-9]/g, '');
        if (clean) targetJid = `${clean}@s.whatsapp.net`;
      }

      try {
        const ppUrl = await ctx.sock.profilePictureUrl(targetJid, 'image');
        if (!ppUrl) {
          await ctx.reply('⚠️ No high-resolution profile picture is visible (user may have private settings).');
          return;
        }

        const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 15000 });
        const isGroupTarget = targetJid.endsWith('@g.us');

        await ctx.sock.sendMessage(
          ctx.chat,
          {
            image: Buffer.from(res.data),
            caption: isGroupTarget ? '🖼️ Group Profile Picture' : `🖼️ Profile Picture of @${targetJid.split('@')[0]}`,
            mentions: [targetJid],
          },
          { quoted: ctx.msg }
        );
      } catch (err: any) {
        await ctx.reply('⚠️ Could not retrieve profile picture. The user/group might not have one or privacy settings block it.');
      }
    },
  },
];
