import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import webp from 'node-webpmux';
import axios from 'axios';
import botConfig from '../config/index.js';
import logger from '../lib/logger.js';

// Configure ffmpeg binary path
if (ffmpegInstaller && ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

export class MediaService {
  /**
   * Embed WhatsApp EXIF metadata into WebP buffer using node-webpmux
   */
  public async addExifMetadata(
    webpBuffer: Buffer,
    packName: string = botConfig.get().STICKER_PACK_NAME,
    author: string = botConfig.get().STICKER_AUTHOR
  ): Promise<Buffer> {
    try {
      const img = new webp.Image();
      await img.load(webpBuffer);

      const json = {
        'sticker-pack-id': 'com.fredrik.bot',
        'sticker-pack-name': packName,
        'sticker-pack-publisher': author,
        emojis: ['🤖'],
      };

      const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x16, 0x00, 0x00, 0x00,
      ]);

      const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
      const exif = Buffer.concat([exifAttr, jsonBuff]);
      exif.writeUIntLE(jsonBuff.length, 14, 4);

      img.exif = exif;
      const result = await img.save(null);
      return result;
    } catch (err) {
      logger.warn({ err }, 'Failed to insert custom EXIF with webpmux, returning original webp');
      return webpBuffer;
    }
  }

  /**
   * Convert image buffer to static WebP sticker (512x512)
   */
  public async imageToSticker(imageBuffer: Buffer): Promise<Buffer> {
    const resized = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 75 })
      .toBuffer();

    return this.addExifMetadata(resized);
  }

  /**
   * Convert video or animated GIF to animated WebP sticker
   */
  public async videoToSticker(videoBuffer: Buffer): Promise<Buffer> {
    const tempDir = os.tmpdir();
    const tempInput = path.join(tempDir, `input_${Date.now()}.mp4`);
    const tempOutput = path.join(tempDir, `output_${Date.now()}.webp`);

    try {
      fs.writeFileSync(tempInput, videoBuffer);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempInput)
          .inputOptions(['-t 6']) // Max 6 seconds to stay strictly under 1MB
          .outputOptions([
            '-vcodec libwebp',
            '-vf scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
            '-lossless 0',
            '-compression_level 6',
            '-q:v 35',
            '-loop 0',
            '-preset default',
            '-an',
            '-vsync 0',
          ])
          .output(tempOutput)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      const outputBuffer = fs.readFileSync(tempOutput);
      return await this.addExifMetadata(outputBuffer);
    } finally {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
  }

  /**
   * Convert WebP sticker to PNG image
   */
  public async stickerToImage(stickerBuffer: Buffer): Promise<Buffer> {
    return sharp(stickerBuffer).png().toBuffer();
  }

  /**
   * Convert animated WebP sticker to MP4 video
   */
  public async stickerToVideo(stickerBuffer: Buffer): Promise<Buffer> {
    const tempDir = os.tmpdir();
    const tempInput = path.join(tempDir, `anim_${Date.now()}.webp`);
    const tempOutput = path.join(tempDir, `anim_${Date.now()}.mp4`);

    try {
      fs.writeFileSync(tempInput, stickerBuffer);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempInput)
          .outputOptions([
            '-pix_fmt yuv420p',
            '-c:v libx264',
            '-movflags +faststart',
            '-filter:v crop=trunc(iw/2)*2:trunc(ih/2)*2',
          ])
          .output(tempOutput)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      return fs.readFileSync(tempOutput);
    } finally {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    }
  }

  /**
   * Convert text to voice audio in WhatsApp native Opus format
   */
  public async textToSpeech(text: string, lang: string = 'en'): Promise<Buffer> {
    const encoded = encodeURIComponent(text.substring(0, 250));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const tempDir = os.tmpdir();
    const tempMp3 = path.join(tempDir, `tts_${Date.now()}.mp3`);
    const tempOpus = path.join(tempDir, `tts_${Date.now()}.opus`);

    try {
      fs.writeFileSync(tempMp3, Buffer.from(response.data));

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempMp3)
          .outputOptions(['-c:a libopus', '-b:a 64k', '-vbr on', '-compression_level 10'])
          .toFormat('opus')
          .save(tempOpus)
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      return fs.readFileSync(tempOpus);
    } catch (err) {
      logger.warn({ err }, 'Opus conversion failed, falling back to raw mp3 buffer');
      return Buffer.from(response.data);
    } finally {
      if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
      if (fs.existsSync(tempOpus)) fs.unlinkSync(tempOpus);
    }
  }

  /**
   * Extract text from image via OCR Space API or free fallback
   */
  public async ocr(imageBuffer: Buffer): Promise<string> {
    try {
      const base64 = imageBuffer.toString('base64');
      const formData = new URLSearchParams();
      formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');

      const response = await axios.post('https://api.ocr.space/parse/image', formData, {
        headers: {
          apikey: 'helloworld',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 25000,
      });

      const parsedText = response.data?.ParsedResults?.[0]?.ParsedText;
      if (parsedText && parsedText.trim()) {
        return parsedText.trim();
      }
      return 'No readable text was detected in the image.';
    } catch (err: any) {
      logger.error({ err: err.message }, 'OCR extraction failed');
      return 'Could not process image text via OCR service.';
    }
  }
}

export const mediaService = new MediaService();
export default mediaService;
