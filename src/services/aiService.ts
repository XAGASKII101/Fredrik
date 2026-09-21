import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import botConfig from '../config/index.js';
import db from '../database/index.js';
import logger from '../lib/logger.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: any;
}

export class AIService {
  private freeAiUrl = 'https://text.pollinations.ai/';

  private getSystemPrompt(): string {
    const config = botConfig.get();
    return (
      `You are ${config.BOT_NAME}, an intelligent, concise, highly capable WhatsApp assistant. ` +
      `You provide direct, helpful, and accurate answers formatted cleanly for WhatsApp using standard markdown ` +
      `(e.g. *bold*, _italics_, \`code\`, and short lists). Keep your responses concise and avoid fluff.`
    );
  }

  /**
   * Query Free Python AI library (g4f)
   */
  private async queryPythonG4F(messages: ChatMessage[]): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const scriptPath = path.resolve(process.cwd(), 'scripts', 'free_ai.py');
        const py = spawn('python', [scriptPath]);

        let output = '';
        py.stdout.on('data', (d) => (output += d.toString()));
        py.on('close', (code) => {
          if (code === 0 && output) {
            try {
              const res = JSON.parse(output.trim());
              if (res.success && res.response) {
                resolve(res.response);
                return;
              }
            } catch {
              // Ignore parse error
            }
          }
          resolve(null);
        });

        py.on('error', () => resolve(null));

        py.stdin.write(JSON.stringify({ messages }));
        py.stdin.end();

        // 25 second timeout
        setTimeout(() => {
          try {
            py.kill();
          } catch {}
          resolve(null);
        }, 25000);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Free, zero-key, unlimited AI Chat with conversation memory
   */
  public async chat(prompt: string, contextKey?: string, customSystem?: string): Promise<string> {
    const config = botConfig.get();

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: customSystem || this.getSystemPrompt(),
      },
    ];

    if (contextKey) {
      const history = db.getAIMemory(contextKey);
      for (const item of history) {
        messages.push({ role: item.role, content: item.content });
      }
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    // 1. First attempt: Fast Free Zero-Credit AI endpoint (Pollinations GPT-4o)
    try {
      const response = await axios.post(
        this.freeAiUrl,
        {
          messages,
          model: 'openai',
          seed: Math.floor(Math.random() * 10000),
          jsonMode: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          timeout: 30000,
        }
      );

      const reply = String(response.data || '').trim();
      if (reply) {
        if (contextKey) {
          db.appendAIMemory(contextKey, prompt, reply);
        }
        return reply;
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Pollinations free AI primary failed, trying Python g4f fallback...');
    }

    // 2. Second attempt: Python g4f (Free GPT4Free)
    const pythonResult = await this.queryPythonG4F(messages);
    if (pythonResult) {
      if (contextKey) {
        db.appendAIMemory(contextKey, prompt, pythonResult);
      }
      return pythonResult;
    }

    // 3. Third attempt: Free Pollinations Mistral/Qwen fallback
    try {
      const fallbackRes = await axios.post(
        this.freeAiUrl,
        {
          messages,
          model: 'mistral',
          seed: 42,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000,
        }
      );
      const reply = String(fallbackRes.data || '').trim();
      if (reply) {
        if (contextKey) {
          db.appendAIMemory(contextKey, prompt, reply);
        }
        return reply;
      }
    } catch (err) {
      logger.error({ err }, 'All free AI providers failed');
    }

    return '⚠️ The AI service is momentarily busy. Please try your request again in a few seconds!';
  }

  /**
   * Vision model understanding: analyze image with prompt
   */
  public async vision(imageBuffer: Buffer, mimeType: string, prompt: string): Promise<string> {
    // We can query image description or vision through multi-modal free endpoint
    try {
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      const response = await axios.post(
        'https://text.pollinations.ai/',
        {
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt || 'Describe what you see in this image in detail.' },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
          model: 'openai',
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000,
        }
      );

      const reply = String(response.data || '').trim();
      if (reply) return reply;
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Vision request to primary model failed, falling back to chat describer');
    }

    return this.chat(`User asked: "${prompt || 'Describe this image'}" about an attached photo.`);
  }

  /**
   * Summarize long text
   */
  public async summarize(text: string): Promise<string> {
    return this.chat(
      `Please provide a clear, bulleted summary of the following text:\n\n${text}`,
      undefined,
      'You are an executive summarizer. Produce concise, clear summaries capturing key points.'
    );
  }

  /**
   * Translate text
   */
  public async translate(text: string, targetLanguage: string = 'English'): Promise<string> {
    return this.chat(
      `Translate the following text into ${targetLanguage}. Maintain original tone and meaning. Only reply with the translation:\n\n${text}`,
      undefined,
      'You are a professional translator. Provide direct, natural translations without commentary.'
    );
  }

  /**
   * Code generation and debugging
   */
  public async code(query: string): Promise<string> {
    return this.chat(
      `Write or explain the following code problem:\n\n${query}`,
      undefined,
      'You are an expert senior software engineer. Provide clean, secure, well-formatted code snippets with concise explanations.'
    );
  }

  /**
   * Reset conversation memory
   */
  public clearMemory(contextKey: string): void {
    db.clearAIMemory(contextKey);
  }
}

export const aiService = new AIService();
export default aiService;
