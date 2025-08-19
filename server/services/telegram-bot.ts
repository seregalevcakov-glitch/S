import TelegramBotApi from 'node-telegram-bot-api';
import { IStorage } from '../storage';
import axios from 'axios';

export class TelegramBot {
  private bot: TelegramBotApi | null = null;
  private token: string;
  private storage: IStorage;
  private isRunning = false;

  constructor(token: string, storage: IStorage) {
    this.token = token;
    this.storage = storage;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      await this.stop();
    }

    try {
      this.bot = new TelegramBotApi(this.token, { polling: true });
      this.setupHandlers();
      this.isRunning = true;
      
      console.log('Telegram bot started successfully');
    } catch (error) {
      console.error('Failed to start Telegram bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.bot && this.isRunning) {
      await this.bot.stopPolling();
      this.bot = null;
      this.isRunning = false;
      console.log('Telegram bot stopped');
    }
  }

  async testConnection(): Promise<{ success: boolean; botInfo?: any; error?: string }> {
    if (!this.bot) {
      return { success: false, error: 'Bot is not running' };
    }

    try {
      const botInfo = await this.bot.getMe();
      return { success: true, botInfo };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private setupHandlers(): void {
    if (!this.bot) return;

    // Handle /notification command
    this.bot.onText(/\/notification (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const message = match?.[1];

      if (!userId || !message) {
        await this.bot?.sendMessage(chatId, '❌ Invalid command format');
        return;
      }

      // Check if user is authorized
      const authorizedUser = await this.storage.getAuthorizedUser(userId.toString());
      if (!authorizedUser || !authorizedUser.isActive) {
        await this.bot?.sendMessage(chatId, '❌ You are not authorized to use this command');
        return;
      }

      try {
        // Send to web server endpoint
        const response = await axios.post('http://localhost:5000/api/roblox/send-notification', {
          message,
          userId,
          timestamp: Date.now()
        });

        if (response.data.success) {
          await this.bot?.sendMessage(chatId, '✅ Message sent to Roblox game successfully!');
          console.log(`Message sent: "${message}" by user ${userId}`);
        } else {
          await this.bot?.sendMessage(chatId, `❌ Failed to send message: ${response.data.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.bot?.sendMessage(chatId, `❌ Failed to send message: ${errorMessage}`);
        console.error('Error sending message:', error);
      }
    });

    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
Welcome to Roblox Notification Bot! 🎮

Use \`/notification <message>\` to send messages to your game.

Example: \`/notification Hello players!\`

Your Telegram ID: \`${msg.from?.id}\`
      `;
      
      await this.bot?.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Handle /status command
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;

      if (!userId) return;

      // Check if user is authorized
      const authorizedUser = await this.storage.getAuthorizedUser(userId.toString());
      if (!authorizedUser || !authorizedUser.isActive) {
        await this.bot?.sendMessage(chatId, '❌ You are not authorized to use this command');
        return;
      }

      try {
        const systemStatus = await this.storage.getSystemStatus();
        const stats = await this.storage.getSystemStats();
        
        let statusMessage = '🤖 **Bot Status:**\n\n';
        
        systemStatus.forEach(status => {
          const emoji = status.status === 'online' ? '✅' : 
                       status.status === 'error' ? '❌' : '⚠️';
          statusMessage += `${emoji} ${status.component.replace('_', ' ')}: ${status.status}\n`;
        });
        
        statusMessage += `\n📊 **Statistics:**\n`;
        statusMessage += `Messages sent: ${stats.totalMessages}\n`;
        statusMessage += `Success rate: ${stats.successRate}%`;
        
        await this.bot?.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
      } catch (error) {
        await this.bot?.sendMessage(chatId, '❌ Failed to get system status');
      }
    });

    // Error handling
    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Telegram bot polling error:', error);
    });
  }
}

export { TelegramBot as default };
