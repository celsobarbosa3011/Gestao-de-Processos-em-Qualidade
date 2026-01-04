import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Profiles Table
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default('user'), // 'admin' or 'user'
  unit: text("unit").notNull(),
  avatar: text("avatar"),
  status: text("status").notNull().default('active'), // 'active' or 'suspended'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Processes Table
export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  unit: text("unit").notNull(),
  type: text("type").notNull(),
  priority: text("priority").notNull().default('medium'), // low, medium, high, critical
  status: text("status").notNull().default('new'), // new, analysis, pending, approved, rejected
  responsibleId: varchar("responsible_id").references(() => profiles.id),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProcessSchema = insertProcessSchema.partial();

export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type UpdateProcess = z.infer<typeof updateProcessSchema>;
export type Process = typeof processes.$inferSelect;

// Process Comments Table
export const processComments = pgTable("process_comments", {
  id: serial("id").primaryKey(),
  processId: serial("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => profiles.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProcessCommentSchema = createInsertSchema(processComments).omit({
  id: true,
  createdAt: true,
});

export type InsertProcessComment = z.infer<typeof insertProcessCommentSchema>;
export type ProcessComment = typeof processComments.$inferSelect;

// Process History/Events Table
export const processEvents = pgTable("process_events", {
  id: serial("id").primaryKey(),
  processId: serial("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => profiles.id),
  action: text("action").notNull(),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertProcessEventSchema = createInsertSchema(processEvents).omit({
  id: true,
  timestamp: true,
});

export type InsertProcessEvent = z.infer<typeof insertProcessEventSchema>;
export type ProcessEvent = typeof processEvents.$inferSelect;

// Alert Settings Table
export const alertSettings = pgTable("alert_settings", {
  id: serial("id").primaryKey(),
  warningDays: serial("warning_days").notNull(),
  criticalDays: serial("critical_days").notNull(),
  stalledDays: serial("stalled_days").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const updateAlertSettingsSchema = createInsertSchema(alertSettings).omit({
  id: true,
  updatedAt: true,
});

export type UpdateAlertSettings = z.infer<typeof updateAlertSettingsSchema>;
export type AlertSettings = typeof alertSettings.$inferSelect;
