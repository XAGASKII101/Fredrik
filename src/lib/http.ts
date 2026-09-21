import express, { Request, Response } from 'express';
import botConfig from '../config/index.js';
import logger from './logger.js';
import whatsappClient from './whatsapp.js';
import { getWebPortalHtml } from './webPortal.js';

export class HttpServer {
  private app: express.Application;
  private server: any = null;
  private startTime: number = Date.now();
  private isConnected: boolean = false;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  public setConnected(status: boolean): void {
    this.isConnected = status;
  }

  private setupRoutes(): void {
    // Web Portal UI
    this.app.get('/', (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/html');
      res.send(getWebPortalHtml());
    });

    // Real-time Status API
    this.app.get('/api/status', (_req: Request, res: Response) => {
      const waStatus = whatsappClient.getStatus();
      const heapMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const rssMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

      res.json({
        botName: botConfig.get().BOT_NAME,
        mode: botConfig.get().MODE,
        prefix: botConfig.get().PREFIX,
        connected: waStatus.connected,
        status: waStatus.status,
        connectedNumber: waStatus.connectedNumber,
        pairingCode: waStatus.pairingCode,
        pairingNumber: waStatus.pairingNumber,
        qrDataUrl: waStatus.qrDataUrl,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        sessionId: waStatus.sessionId,
        ramUsage: `${heapMb} MB (Heap) / ${rssMb} MB (RSS)`,
      });
    });

    // QR Code API
    this.app.get('/api/qr', (_req: Request, res: Response) => {
      const waStatus = whatsappClient.getStatus();
      res.json({
        status: waStatus.status,
        qr: waStatus.qr,
        qrDataUrl: waStatus.qrDataUrl,
      });
    });

    // Pairing Code Request API
    this.app.post('/api/pair', async (req: Request, res: Response) => {
      try {
        const { phoneNumber } = req.body;
        if (!phoneNumber || typeof phoneNumber !== 'string') {
          return res.status(400).json({ success: false, error: 'Valid phone number is required.' });
        }

        const pairingCode = await whatsappClient.requestPairingCode(phoneNumber);
        return res.json({ success: true, pairingCode, phoneNumber });
      } catch (err: any) {
        logger.error({ err }, 'Error in /api/pair endpoint');
        return res.status(400).json({ success: false, error: err?.message || 'Failed to request pairing code' });
      }
    });

    // Unlink / Logout API
    this.app.post('/api/logout', async (_req: Request, res: Response) => {
      try {
        await whatsappClient.logout();
        return res.json({ success: true, message: 'WhatsApp session logged out and cleared.' });
      } catch (err: any) {
        logger.error({ err }, 'Error in /api/logout endpoint');
        return res.status(500).json({ success: false, error: err?.message || 'Failed to logout session' });
      }
    });

    // Restart Socket API
    this.app.post('/api/restart', async (_req: Request, res: Response) => {
      try {
        await whatsappClient.reconnect();
        return res.json({ success: true, message: 'Reconnection triggered.' });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err?.message || 'Failed to reconnect' });
      }
    });

    // Cloud health check endpoint (Render / Railway / Uptime monitoring)
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        botConnected: this.isConnected,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      });
    });

    // Readiness endpoint
    this.app.get('/ready', (_req: Request, res: Response) => {
      if (this.isConnected) {
        res.status(200).json({ ready: true });
      } else {
        res.status(503).json({ ready: false, message: 'WhatsApp socket connecting' });
      }
    });
  }

  public start(): void {
    const port = botConfig.get().PORT;
    this.server = this.app.listen(port, () => {
      logger.info(`HTTP Healthcheck Server listening on port ${port}`);
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      logger.info('HTTP Server stopped');
    }
  }
}

export const httpServer = new HttpServer();
export default httpServer;
