import { 
  type User, type InsertUser,
  type TelegramConfig, type InsertTelegramConfig,
  type AuthorizedUser, type InsertAuthorizedUser,
  type RobloxConfig, type InsertRobloxConfig,
  type MessageLog, type InsertMessageLog,
  type SystemStatus, type InsertSystemStatus
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Telegram configuration
  getTelegramConfig(): Promise<TelegramConfig | undefined>;
  createTelegramConfig(config: InsertTelegramConfig): Promise<TelegramConfig>;
  updateTelegramConfig(id: string, config: Partial<InsertTelegramConfig>): Promise<TelegramConfig | undefined>;

  // Authorized users
  getAuthorizedUsers(): Promise<AuthorizedUser[]>;
  getAuthorizedUser(telegramUserId: string): Promise<AuthorizedUser | undefined>;
  createAuthorizedUser(user: InsertAuthorizedUser): Promise<AuthorizedUser>;
  removeAuthorizedUser(telegramUserId: string): Promise<boolean>;

  // Roblox configuration
  getRobloxConfig(): Promise<RobloxConfig | undefined>;
  createRobloxConfig(config: InsertRobloxConfig): Promise<RobloxConfig>;
  updateRobloxConfig(id: string, config: Partial<InsertRobloxConfig>): Promise<RobloxConfig | undefined>;

  // Message logs
  getMessageLogs(limit?: number): Promise<MessageLog[]>;
  createMessageLog(log: InsertMessageLog): Promise<MessageLog>;
  clearMessageLogs(): Promise<boolean>;

  // System status
  getSystemStatus(): Promise<SystemStatus[]>;
  updateSystemStatus(component: string, status: string, message?: string): Promise<SystemStatus>;
  getSystemStats(): Promise<{ totalMessages: number; successRate: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private telegramConfigs: Map<string, TelegramConfig>;
  private authorizedUsers: Map<string, AuthorizedUser>;
  private robloxConfigs: Map<string, RobloxConfig>;
  private messageLogs: MessageLog[];
  private systemStatuses: Map<string, SystemStatus>;

  constructor() {
    this.users = new Map();
    this.telegramConfigs = new Map();
    this.authorizedUsers = new Map();
    this.robloxConfigs = new Map();
    this.messageLogs = [];
    this.systemStatuses = new Map();

    // Initialize default system statuses
    const components = ['telegram_bot', 'web_server', 'roblox_connection'];
    components.forEach(component => {
      const status: SystemStatus = {
        id: randomUUID(),
        component,
        status: component === 'web_server' ? 'online' : 'offline',
        lastCheck: new Date(),
        message: null
      };
      this.systemStatuses.set(component, status);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTelegramConfig(): Promise<TelegramConfig | undefined> {
    return Array.from(this.telegramConfigs.values()).find(config => config.isActive);
  }

  async createTelegramConfig(insertConfig: InsertTelegramConfig): Promise<TelegramConfig> {
    const id = randomUUID();
    const config: TelegramConfig = {
      ...insertConfig,
      id,
      isActive: insertConfig.isActive ?? true,
      createdAt: new Date(),
    };
    this.telegramConfigs.set(id, config);
    return config;
  }

  async updateTelegramConfig(id: string, updates: Partial<InsertTelegramConfig>): Promise<TelegramConfig | undefined> {
    const config = this.telegramConfigs.get(id);
    if (!config) return undefined;
    
    const updated = { ...config, ...updates };
    this.telegramConfigs.set(id, updated);
    return updated;
  }

  async getAuthorizedUsers(): Promise<AuthorizedUser[]> {
    return Array.from(this.authorizedUsers.values()).filter(user => user.isActive);
  }

  async getAuthorizedUser(telegramUserId: string): Promise<AuthorizedUser | undefined> {
    return this.authorizedUsers.get(telegramUserId);
  }

  async createAuthorizedUser(insertUser: InsertAuthorizedUser): Promise<AuthorizedUser> {
    const id = randomUUID();
    const user: AuthorizedUser = {
      ...insertUser,
      id,
      isActive: insertUser.isActive ?? true,
      username: insertUser.username ?? null,
      createdAt: new Date(),
    };
    this.authorizedUsers.set(insertUser.telegramUserId, user);
    return user;
  }

  async removeAuthorizedUser(telegramUserId: string): Promise<boolean> {
    return this.authorizedUsers.delete(telegramUserId);
  }

  async getRobloxConfig(): Promise<RobloxConfig | undefined> {
    return Array.from(this.robloxConfigs.values()).find(config => config.isActive);
  }

  async createRobloxConfig(insertConfig: InsertRobloxConfig): Promise<RobloxConfig> {
    const id = randomUUID();
    const config: RobloxConfig = {
      ...insertConfig,
      id,
      isActive: insertConfig.isActive ?? true,
      universeId: insertConfig.universeId ?? null,
      placeId: insertConfig.placeId ?? null,
      webhookUrl: insertConfig.webhookUrl ?? null,
      apiKey: insertConfig.apiKey ?? null,
      createdAt: new Date(),
    };
    this.robloxConfigs.set(id, config);
    return config;
  }

  async updateRobloxConfig(id: string, updates: Partial<InsertRobloxConfig>): Promise<RobloxConfig | undefined> {
    const config = this.robloxConfigs.get(id);
    if (!config) return undefined;
    
    const updated = { ...config, ...updates };
    this.robloxConfigs.set(id, updated);
    return updated;
  }

  async getMessageLogs(limit = 50): Promise<MessageLog[]> {
    return this.messageLogs
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createMessageLog(insertLog: InsertMessageLog): Promise<MessageLog> {
    const id = randomUUID();
    const log: MessageLog = {
      ...insertLog,
      id,
      errorMessage: insertLog.errorMessage ?? null,
      timestamp: new Date(),
    };
    this.messageLogs.push(log);
    return log;
  }

  async clearMessageLogs(): Promise<boolean> {
    this.messageLogs = [];
    return true;
  }

  async getSystemStatus(): Promise<SystemStatus[]> {
    return Array.from(this.systemStatuses.values());
  }

  async updateSystemStatus(component: string, status: string, message?: string): Promise<SystemStatus> {
    const existing = this.systemStatuses.get(component);
    const updated: SystemStatus = {
      id: existing?.id || randomUUID(),
      component,
      status,
      lastCheck: new Date(),
      message: message || null
    };
    this.systemStatuses.set(component, updated);
    return updated;
  }

  async getSystemStats(): Promise<{ totalMessages: number; successRate: number }> {
    const totalMessages = this.messageLogs.length;
    const successfulMessages = this.messageLogs.filter(log => log.status === 'success').length;
    const successRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;
    
    return {
      totalMessages,
      successRate: Math.round(successRate * 10) / 10 // Round to 1 decimal place
    };
  }
}

export const storage = new MemStorage();
