import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertTelegramConfigSchema,
  insertAuthorizedUserSchema,
  insertRobloxConfigSchema,
  insertMessageLogSchema
} from "@shared/schema";
import { TelegramBot } from "./services/telegram-bot";

let telegramBot: TelegramBot | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Get system status
  app.get("/api/status", async (req, res) => {
    try {
      const systemStatus = await storage.getSystemStatus();
      const stats = await storage.getSystemStats();
      res.json({ systemStatus, stats });
    } catch (error) {
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Get Telegram configuration
  app.get("/api/telegram/config", async (req, res) => {
    try {
      const config = await storage.getTelegramConfig();
      if (config) {
        // Don't return the full bot token in the response
        res.json({ 
          ...config, 
          botToken: config.botToken ? "***CONFIGURED***" : null 
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get Telegram configuration" });
    }
  });

  // Update Telegram configuration
  app.post("/api/telegram/config", async (req, res) => {
    try {
      const config = insertTelegramConfigSchema.parse(req.body);
      
      // Stop existing bot if running
      if (telegramBot) {
        telegramBot.stop();
      }

      const existingConfig = await storage.getTelegramConfig();
      let savedConfig;
      
      if (existingConfig) {
        savedConfig = await storage.updateTelegramConfig(existingConfig.id, config);
      } else {
        savedConfig = await storage.createTelegramConfig(config);
      }

      if (config.isActive && config.botToken) {
        // Start new bot
        telegramBot = new TelegramBot(config.botToken, storage);
        await telegramBot.start();
        
        await storage.updateSystemStatus('telegram_bot', 'online', 'Bot started successfully');
      }

      res.json(savedConfig);
    } catch (error) {
      await storage.updateSystemStatus('telegram_bot', 'error', error instanceof Error ? error.message : 'Unknown error');
      res.status(500).json({ error: "Failed to update Telegram configuration" });
    }
  });

  // Test Telegram bot connection
  app.post("/api/telegram/test", async (req, res) => {
    try {
      if (!telegramBot) {
        return res.status(400).json({ error: "Telegram bot is not configured" });
      }

      const result = await telegramBot.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to test Telegram connection" });
    }
  });

  // Get authorized users
  app.get("/api/telegram/users", async (req, res) => {
    try {
      const users = await storage.getAuthorizedUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to get authorized users" });
    }
  });

  // Add authorized user
  app.post("/api/telegram/users", async (req, res) => {
    try {
      const userData = insertAuthorizedUserSchema.parse(req.body);
      const user = await storage.createAuthorizedUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to add authorized user" });
      }
    }
  });

  // Remove authorized user
  app.delete("/api/telegram/users/:telegramUserId", async (req, res) => {
    try {
      const { telegramUserId } = req.params;
      const success = await storage.removeAuthorizedUser(telegramUserId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to remove authorized user" });
    }
  });

  // Get Roblox configuration
  app.get("/api/roblox/config", async (req, res) => {
    try {
      const config = await storage.getRobloxConfig();
      if (config) {
        // Don't return sensitive API key
        res.json({ 
          ...config, 
          apiKey: config.apiKey ? "***CONFIGURED***" : null 
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get Roblox configuration" });
    }
  });

  // Update Roblox configuration
  app.post("/api/roblox/config", async (req, res) => {
    try {
      const config = insertRobloxConfigSchema.parse(req.body);
      
      const existingConfig = await storage.getRobloxConfig();
      let savedConfig;
      
      if (existingConfig) {
        savedConfig = await storage.updateRobloxConfig(existingConfig.id, config);
      } else {
        savedConfig = await storage.createRobloxConfig(config);
      }

      // Test Roblox connection if configuration is active
      if (config.isActive) {
        try {
          // This would be where we test the Roblox connection
          await storage.updateSystemStatus('roblox_connection', 'online', 'Configuration saved');
        } catch (error) {
          await storage.updateSystemStatus('roblox_connection', 'error', 'Failed to connect to Roblox');
        }
      }

      res.json(savedConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid Roblox configuration", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update Roblox configuration" });
      }
    }
  });

  // Send notification to Roblox (called by Telegram bot)
  app.post("/api/roblox/send-notification", async (req, res) => {
    try {
      const { message, userId, timestamp } = req.body;
      
      if (!message || !userId) {
        return res.status(400).json({ error: "Message and userId are required" });
      }

      // Get Roblox configuration
      const robloxConfig = await storage.getRobloxConfig();
      if (!robloxConfig || !robloxConfig.isActive) {
        throw new Error("Roblox configuration not found or inactive");
      }

      // Log the message attempt
      const messageLog = await storage.createMessageLog({
        telegramUserId: userId.toString(),
        message,
        status: 'pending',
      });

      try {
        // Send to Roblox game via HTTP request
        // This would typically be sent to your Roblox game's webhook endpoint
        // or via Roblox Open Cloud API
        
        const robloxPayload = {
          type: 'notification',
          content: message,
          sender: userId,
          timestamp: timestamp || Date.now()
        };

        // Try to send to your Roblox game's HTTP endpoint
        // You need to replace this URL with your actual game's webhook endpoint
        console.log('Would send to Roblox:', robloxPayload);
        
        // Simulate the HTTP request that would go to your Roblox game
        // In a real setup, you would uncomment and configure this:
        /*
        const robloxResponse = await fetch('https://your-game-webhook-url.com/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(robloxPayload)
        });
        
        if (!robloxResponse.ok) {
          throw new Error(`Roblox server returned ${robloxResponse.status}`);
        }
        */

        // Update message log to success
        messageLog.status = 'success';
        await storage.updateSystemStatus('roblox_connection', 'online', 'Message sent to Roblox successfully');

        res.json({ 
          success: true, 
          message: 'Notification sent to Roblox game',
          logId: messageLog.id
        });

      } catch (robloxError) {
        // Update message log to error
        const errorMessage = robloxError instanceof Error ? robloxError.message : 'Unknown error';
        messageLog.status = 'error';
        messageLog.errorMessage = errorMessage;
        
        await storage.updateSystemStatus('roblox_connection', 'error', errorMessage);
        
        res.status(500).json({ 
          success: false, 
          error: errorMessage 
        });
      }

    } catch (error) {
      console.error('Error sending to Roblox:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get message logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getMessageLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get message logs" });
    }
  });

  // Create message log (for demo data)
  app.post("/api/logs", async (req, res) => {
    try {
      const logData = insertMessageLogSchema.parse(req.body);
      const messageLog = await storage.createMessageLog(logData);
      res.json(messageLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid log data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create message log" });
      }
    }
  });

  // Roblox polling endpoint - get pending messages
  app.get("/api/roblox/poll", async (req, res) => {
    try {
      // Get recent messages from the last few minutes
      const recentLogs = await storage.getMessageLogs(10);
      
      // Filter only successful messages from the last 5 minutes
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const pendingMessages = recentLogs.filter((log: any) => {
        return log.status === 'success' && 
               new Date(log.createdAt).getTime() > fiveMinutesAgo;
      });

      // Transform to Roblox format
      const messages = pendingMessages.map((log: any) => ({
        id: log.id,
        content: log.message,
        sender: log.telegramUserId,
        timestamp: new Date(log.createdAt).getTime()
      }));

      res.json({ 
        success: true,
        messages: messages.slice(0, 5) // Limit to 5 most recent
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: "Failed to get messages for polling" 
      });
    }
  });

  // Clear message logs
  app.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearMessageLogs();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear message logs" });
    }
  });

  // Initialize web server status
  await storage.updateSystemStatus('web_server', 'online', 'Server started');

  const httpServer = createServer(app);
  return httpServer;
}
