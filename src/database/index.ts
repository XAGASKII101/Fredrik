import fs from 'fs';
import path from 'path';
import logger from '../lib/logger.js';

export interface UserData {
  jid: string;
  name?: string;
  points: number;
  warnings: number;
  isBanned: boolean;
  notes: string[];
}

export interface GroupData {
  jid: string;
  name?: string;
  antilink: boolean;
  antispam: boolean;
  antidelete: boolean;
  welcomeMessage?: string;
  goodbyeMessage?: string;
  rules?: string;
}

export interface ReminderData {
  id: string;
  jid: string;
  time: number; // timestamp in ms
  text: string;
  completed: boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DatabaseState {
  users: Record<string, UserData>;
  groups: Record<string, GroupData>;
  reminders: ReminderData[];
  aiMemory: Record<string, AIMessage[]>;
  settings: Record<string, any>;
}

const defaultState: DatabaseState = {
  users: {},
  groups: {},
  reminders: [],
  aiMemory: {},
  settings: {},
};

class Database {
  private filePath: string;
  private state: DatabaseState;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'fredrik_db.json');
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return { ...defaultState, ...JSON.parse(raw) };
      }
    } catch (err) {
      logger.error({ err }, 'Failed to load database file, initializing defaults');
    }
    return { ...defaultState };
  }

  public save(): void {
    try {
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      logger.error({ err }, 'Failed to persist database');
    }
  }

  // User methods
  public getUser(jid: string): UserData {
    if (!this.state.users[jid]) {
      this.state.users[jid] = {
        jid,
        points: 0,
        warnings: 0,
        isBanned: false,
        notes: [],
      };
      this.save();
    }
    return this.state.users[jid];
  }

  public updateUser(jid: string, partial: Partial<UserData>): UserData {
    const current = this.getUser(jid);
    this.state.users[jid] = { ...current, ...partial };
    this.save();
    return this.state.users[jid];
  }

  // Group methods
  public getGroup(jid: string): GroupData {
    if (!this.state.groups[jid]) {
      this.state.groups[jid] = {
        jid,
        antilink: true,
        antispam: true,
        antidelete: true,
      };
      this.save();
    }
    return this.state.groups[jid];
  }

  public updateGroup(jid: string, partial: Partial<GroupData>): GroupData {
    const current = this.getGroup(jid);
    this.state.groups[jid] = { ...current, ...partial };
    this.save();
    return this.state.groups[jid];
  }

  // Reminders
  public addReminder(reminder: ReminderData): void {
    this.state.reminders.push(reminder);
    this.save();
  }

  public getPendingReminders(): ReminderData[] {
    return this.state.reminders.filter((r) => !r.completed);
  }

  public completeReminder(id: string): void {
    const r = this.state.reminders.find((item) => item.id === id);
    if (r) {
      r.completed = true;
      this.save();
    }
  }

  // AI Memory (Sliding window of recent messages per user or group)
  public getAIMemory(key: string): AIMessage[] {
    return this.state.aiMemory[key] || [];
  }

  public appendAIMemory(key: string, userMessage: string, assistantMessage: string, maxTurns = 8): void {
    if (!this.state.aiMemory[key]) {
      this.state.aiMemory[key] = [];
    }
    const memory = this.state.aiMemory[key];
    memory.push({ role: 'user', content: userMessage });
    memory.push({ role: 'assistant', content: assistantMessage });

    // Keep sliding window
    if (memory.length > maxTurns * 2) {
      this.state.aiMemory[key] = memory.slice(-maxTurns * 2);
    }
    this.save();
  }

  public clearAIMemory(key: string): void {
    delete this.state.aiMemory[key];
    this.save();
  }

  // General settings
  public getSetting<T>(key: string, defaultValue: T): T {
    return this.state.settings[key] !== undefined ? this.state.settings[key] : defaultValue;
  }

  public setSetting<T>(key: string, value: T): void {
    this.state.settings[key] = value;
    this.save();
  }
}

export const db = new Database();
export default db;
