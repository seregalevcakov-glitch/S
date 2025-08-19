import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const telegramConfig = pgTable("telegram_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botToken: text("bot_token").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const authorizedUsers = pgTable("authorized_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramUserId: text("telegram_user_id").notNull().unique(),
  username: text("username"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const robloxConfig = pgTable("roblox_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  universeId: text("universe_id"),
  placeId: text("place_id"),
  webhookUrl: text("webhook_url"),
  apiKey: text("api_key"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const messageLog = pgTable("message_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramUserId: text("telegram_user_id").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(), // 'success', 'error', 'pending'
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").default(sql`now()`),
});

export const systemStatus = pgTable("system_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  component: text("component").notNull(), // 'telegram_bot', 'web_server', 'roblox_connection'
  status: text("status").notNull(), // 'online', 'offline', 'error', 'pending'
  lastCheck: timestamp("last_check").default(sql`now()`),
  message: text("message"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTelegramConfigSchema = createInsertSchema(telegramConfig).pick({
  botToken: true,
  isActive: true,
});

export const insertAuthorizedUserSchema = createInsertSchema(authorizedUsers).pick({
  telegramUserId: true,
  username: true,
  isActive: true,
});

export const insertRobloxConfigSchema = createInsertSchema(robloxConfig).pick({
  universeId: true,
  placeId: true,
  webhookUrl: true,
  apiKey: true,
  isActive: true,
});

export const insertMessageLogSchema = createInsertSchema(messageLog).pick({
  telegramUserId: true,
  message: true,
  status: true,
  errorMessage: true,
});

export const insertSystemStatusSchema = createInsertSchema(systemStatus).pick({
  component: true,
  status: true,
  message: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TelegramConfig = typeof telegramConfig.$inferSelect;
export type InsertTelegramConfig = z.infer<typeof insertTelegramConfigSchema>;

export type AuthorizedUser = typeof authorizedUsers.$inferSelect;
export type InsertAuthorizedUser = z.infer<typeof insertAuthorizedUserSchema>;

export type RobloxConfig = typeof robloxConfig.$inferSelect;
export type InsertRobloxConfig = z.infer<typeof insertRobloxConfigSchema>;

export type MessageLog = typeof messageLog.$inferSelect;
export type InsertMessageLog = z.infer<typeof insertMessageLogSchema>;

export type SystemStatus = typeof systemStatus.$inferSelect;
export type InsertSystemStatus = z.infer<typeof insertSystemStatusSchema>;
