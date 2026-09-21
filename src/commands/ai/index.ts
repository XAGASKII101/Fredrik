import { Command } from '../../lib/commandRegistry.js';
import aiService from '../../services/aiService.js';
import mediaService from '../../services/mediaService.js';
import formatForWhatsApp from '../../utils/formatter.js';
import sharp from 'sharp';

export const aiCommands: Command[] = [
  {
    name: 'ai',
    description: 'Ask AI question with conversation memory',
    category: 'ai',
    aliases: ['ask', 'chat', 'gpt'],
    usage: 'ai <your question>',
    cooldown: 3,
    execute: async (ctx) => {
      if (!ctx.text) {
        await ctx.reply(
          `🧠 *Fredrik AI*\nPlease provide a prompt or question.\nExample: \`${ctx.prefix}ai Explain quantum computing simply\``
        );
        return;
      }

      await ctx.react('💭');
      const contextKey = ctx.isGroup ? `${ctx.chat}:${ctx.sender}` : ctx.sender;
      const rawResponse = await aiService.chat(ctx.text, contextKey);
      const cleanResponse = formatForWhatsApp(rawResponse);
      await ctx.reply(cleanResponse);
      await ctx.react('🤖');
    },
  },
  {
    name: 'vision',
    description: 'Analyze an image with AI and OCR',
    category: 'ai',
    aliases: ['see', 'analyze'],
    usage: 'vision <optional question> (reply to an image)',
    cooldown: 5,
    execute: async (ctx) => {
      const m = ctx.unwrappedMessage || ctx.msg.message;
      const isImageQuoted = ctx.quoted?.mediaType === 'image' || ctx.quoted?.mediaType === 'sticker';
      const isImageDirect = !!m?.imageMessage || !!m?.stickerMessage;

      if (!isImageQuoted && !isImageDirect) {
        await ctx.reply(
          `👁️ *AI Vision*\nPlease send or reply to an image with \`${ctx.prefix}vision [optional question]\`.`
        );
        return;
      }

      await ctx.react('🔍');
      const buffer = await ctx.downloadMedia();
      if (!buffer) {
        await ctx.reply('❌ Failed to download image.');
        return;
      }

      const prompt = ctx.text || 'Describe what you see in this image and explain any important details.';

      try {
        // 1. Extract image dimensions and details
        let metaInfo = '';
        try {
          const metadata = await sharp(buffer).metadata();
          metaInfo = `Format: ${metadata.format?.toUpperCase() || 'JPEG'}, Resolution: ${metadata.width}x${metadata.height}`;
        } catch {}

        // 2. Run OCR to read any text present in the image
        const ocrText = await mediaService.ocr(buffer);
        const hasText = ocrText && !ocrText.includes('No readable text') && !ocrText.includes('Could not process');

        let combinedPrompt = `The user shared an image with the following technical properties:\n${metaInfo}\n\n`;
        if (hasText) {
          combinedPrompt += `Text detected in the image:\n"""\n${ocrText}\n"""\n\n`;
        }
        combinedPrompt += `User's question/instruction:\n"${prompt}"\n\nPlease provide a clear, helpful, and insightful response.`;

        const rawResult = await aiService.chat(
          combinedPrompt,
          undefined,
          'You are an expert visual analysis assistant for WhatsApp. Deliver structured, neat insights.'
        );

        let formatted = formatForWhatsApp(rawResult);
        if (hasText && !prompt.toLowerCase().includes('text')) {
          formatted += `\n\n📝 *Detected Text:*\n_${ocrText.substring(0, 300)}${ocrText.length > 300 ? '...' : ''}_`;
        }

        await ctx.reply(formatted);
      } catch (err: any) {
        await ctx.reply(`⚠️ Vision analysis failed: ${err.message || 'Unknown error'}`);
      }
    },
  },
  {
    name: 'summarize',
    description: 'Summarize long text or article',
    category: 'ai',
    aliases: ['summary', 'sum'],
    usage: 'summarize <text> (or reply to text message)',
    cooldown: 4,
    execute: async (ctx) => {
      const targetText = ctx.text || ctx.quoted?.text;
      if (!targetText) {
        await ctx.reply(
          `📝 *Fredrik Summarizer*\nPlease provide text to summarize or reply to a message with \`${ctx.prefix}summarize\`.`
        );
        return;
      }

      await ctx.react('⏳');
      const rawSummary = await aiService.summarize(targetText);
      await ctx.reply(formatForWhatsApp(rawSummary));
    },
  },
  {
    name: 'translate',
    description: 'Translate text to a target language',
    category: 'ai',
    aliases: ['tr'],
    usage: 'translate <language> <text>',
    cooldown: 3,
    execute: async (ctx) => {
      const parts = ctx.args;
      if (parts.length === 0 && !ctx.quoted?.text) {
        await ctx.reply(
          `🌐 *Fredrik Translator*\nUsage:\n\`${ctx.prefix}translate Spanish Hello, how are you today?\`\nOr reply to a message with \`${ctx.prefix}translate French\``
        );
        return;
      }

      let targetLang = 'English';
      let contentToTranslate = '';

      if (ctx.quoted?.text) {
        targetLang = parts[0] || 'English';
        contentToTranslate = ctx.quoted.text;
      } else {
        targetLang = parts[0];
        contentToTranslate = parts.slice(1).join(' ');
      }

      if (!contentToTranslate) {
        await ctx.reply(`Please provide text to translate.`);
        return;
      }

      await ctx.react('🌐');
      const rawTranslated = await aiService.translate(contentToTranslate, targetLang);
      await ctx.reply(`*Translation (${targetLang}):*\n${formatForWhatsApp(rawTranslated)}`);
    },
  },
  {
    name: 'code',
    description: 'Ask AI for programming assistance or code generation',
    category: 'ai',
    aliases: ['dev', 'coder'],
    usage: 'code <prompt>',
    cooldown: 4,
    execute: async (ctx) => {
      if (!ctx.text) {
        await ctx.reply(
          `💻 *Fredrik Code Helper*\nUsage: \`${ctx.prefix}code Write a debounce function in TypeScript\``
        );
        return;
      }

      await ctx.react('💻');
      const rawCodeReply = await aiService.code(ctx.text);
      await ctx.reply(formatForWhatsApp(rawCodeReply));
    },
  },
  {
    name: 'clearmemory',
    description: 'Clear AI chat conversation history for this chat',
    category: 'ai',
    aliases: ['forget', 'resetai'],
    execute: async (ctx) => {
      const contextKey = ctx.isGroup ? `${ctx.chat}:${ctx.sender}` : ctx.sender;
      aiService.clearMemory(contextKey);
      await ctx.reply('🧹 AI conversation memory has been cleared.');
    },
  },
];
