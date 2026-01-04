import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, serial, boolean, integer } from "drizzle-orm/pg-core";
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
  provisionalPassword: text("provisional_password"),
  provisionalPasswordExpiresAt: timestamp("provisional_password_expires_at"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  motherName: text("mother_name"),
  cpf: text("cpf"),
  cep: text("cep"),
  address: text("address"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  phone: text("phone"),
  secondaryPhone: text("secondary_phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Healthcare Units Table
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  cnpj: text("cnpj").notNull().unique(),
  razaoSocial: text("razao_social").notNull(),
  nomeFantasia: text("nome_fantasia"),
  cep: text("cep"),
  address: text("address"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  phone: text("phone"),
  website: text("website"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  email: text("email"),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
});

export const updateUnitSchema = insertUnitSchema.partial();

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type UpdateUnit = z.infer<typeof updateUnitSchema>;
export type Unit = typeof units.$inferSelect;

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
});

export const insertProfileSchemaForApi = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  password: true,
  provisionalPassword: true,
  provisionalPasswordExpiresAt: true,
  mustChangePassword: true,
  profileCompleted: true,
});

export const updateProfileSchema = insertProfileSchema.partial().omit({
  password: true,
  email: true,
});

export const adminUpdateProfileSchema = insertProfileSchema.partial().omit({
  password: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type AdminUpdateProfile = z.infer<typeof adminUpdateProfileSchema>;
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
  processId: integer("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
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
  processId: integer("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
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

// White Label / Branding Configuration Table
export const brandingConfig = pgTable("branding_config", {
  id: serial("id").primaryKey(),
  appName: text("app_name").notNull().default('MediFlow'),
  tagline: text("tagline").default('Gestão Administrativa para Unidades de Saúde'),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").notNull().default('#0F766E'), // Teal-700
  primaryForeground: text("primary_foreground").notNull().default('#FFFFFF'),
  accentColor: text("accent_color").default('#14B8A6'), // Teal-500
  footerText: text("footer_text").default('© 2025 Todos os direitos reservados'),
  supportEmail: text("support_email"),
  customDomain: text("custom_domain"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const updateBrandingConfigSchema = createInsertSchema(brandingConfig).omit({
  id: true,
  updatedAt: true,
});

export type UpdateBrandingConfig = z.infer<typeof updateBrandingConfigSchema>;
export type BrandingConfig = typeof brandingConfig.$inferSelect;

// Process Checklists Table
export const processChecklists = pgTable("process_checklists", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProcessChecklistSchema = createInsertSchema(processChecklists).omit({
  id: true,
  createdAt: true,
});

export type InsertProcessChecklist = z.infer<typeof insertProcessChecklistSchema>;
export type ProcessChecklist = typeof processChecklists.$inferSelect;

// Process Attachments Table
export const processAttachments = pgTable("process_attachments", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => profiles.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProcessAttachmentSchema = createInsertSchema(processAttachments).omit({
  id: true,
  createdAt: true,
});

export type InsertProcessAttachment = z.infer<typeof insertProcessAttachmentSchema>;
export type ProcessAttachment = typeof processAttachments.$inferSelect;

// Process Labels Table
export const processLabels = pgTable("process_labels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default('#6B7280'),
});

export const insertProcessLabelSchema = createInsertSchema(processLabels).omit({
  id: true,
});

export type InsertProcessLabel = z.infer<typeof insertProcessLabelSchema>;
export type ProcessLabel = typeof processLabels.$inferSelect;

// Process to Labels Junction Table
export const processToLabels = pgTable("process_to_labels", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  labelId: integer("label_id").notNull().references(() => processLabels.id, { onDelete: 'cascade' }),
});

export type ProcessToLabel = typeof processToLabels.$inferSelect;

// WIP (Work In Progress) Limits per Column
export const wipLimits = pgTable("wip_limits", {
  id: serial("id").primaryKey(),
  columnId: text("column_id").notNull().unique(), // 'new', 'analysis', 'pending', 'approved', 'rejected'
  maxItems: integer("max_items").notNull().default(10),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWipLimitSchema = createInsertSchema(wipLimits).omit({
  id: true,
  updatedAt: true,
});

export const updateWipLimitSchema = insertWipLimitSchema.partial();

export type InsertWipLimit = z.infer<typeof insertWipLimitSchema>;
export type UpdateWipLimit = z.infer<typeof updateWipLimitSchema>;
export type WipLimit = typeof wipLimits.$inferSelect;

// Chat Messages Table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => profiles.id),
  receiverId: varchar("receiver_id").references(() => profiles.id), // null = broadcast/global
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Permissions Table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g., 'admin.panel', 'users.read'
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default('general'),
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
});

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

// Role Permissions Junction Table
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'admin' or 'user'
  permissionKey: text("permission_key").notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;

// User Permissions (overrides for specific users)
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  permissionKey: text("permission_key").notNull(),
  granted: boolean("granted").notNull().default(true),
});

export type UserPermission = typeof userPermissions.$inferSelect;

// Process Templates Table
export const processTemplates = pgTable("process_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  priority: text("priority").notNull().default('medium'),
  defaultChecklist: text("default_checklist").array(),
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProcessTemplateSchema = createInsertSchema(processTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertProcessTemplate = z.infer<typeof insertProcessTemplateSchema>;
export type ProcessTemplate = typeof processTemplates.$inferSelect;

// Feature Toggles (Admin controls which features are enabled)
export const featureToggles = pgTable("feature_toggles", {
  id: serial("id").primaryKey(),
  featureKey: text("feature_key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type FeatureToggle = typeof featureToggles.$inferSelect;

// Time Tracking Table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => profiles.id),
  description: text("description"),
  minutes: integer("minutes").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

// Custom Fields Definition Table
export const customFields = pgTable("custom_fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'text', 'number', 'date', 'select', 'checkbox'
  options: text("options").array(), // For select type
  required: boolean("required").notNull().default(false),
  showOnCard: boolean("show_on_card").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomFieldSchema = createInsertSchema(customFields).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type CustomField = typeof customFields.$inferSelect;

// Custom Field Values Table
export const customFieldValues = pgTable("custom_field_values", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  fieldId: integer("field_id").notNull().references(() => customFields.id, { onDelete: 'cascade' }),
  value: text("value"),
});

export const insertCustomFieldValueSchema = createInsertSchema(customFieldValues).omit({
  id: true,
});

export type InsertCustomFieldValue = z.infer<typeof insertCustomFieldValueSchema>;
export type CustomFieldValue = typeof customFieldValues.$inferSelect;

// Automations Table
export const automations = pgTable("automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").notNull(), // 'status_change', 'deadline_approaching', 'new_process', 'field_update'
  triggerConfig: text("trigger_config"), // JSON config for trigger conditions
  action: text("action").notNull(), // 'change_status', 'assign_user', 'add_label', 'send_notification', 'add_checklist'
  actionConfig: text("action_config"), // JSON config for action params
  enabled: boolean("enabled").notNull().default(true),
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
});

export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type Automation = typeof automations.$inferSelect;

// Notifications Table (persistent notifications)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'process_assigned', 'deadline', 'mention', 'status_change', 'comment'
  title: text("title").notNull(),
  message: text("message").notNull(),
  processId: integer("process_id").references(() => processes.id, { onDelete: 'cascade' }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Swimlane Configuration Table
export const swimlanes = pgTable("swimlanes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  field: text("field").notNull(), // 'unit', 'type', 'priority', 'responsible'
  order: integer("order").notNull().default(0),
  collapsed: boolean("collapsed").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
});

export const insertSwimlaneSchema = createInsertSchema(swimlanes).omit({
  id: true,
});

export type InsertSwimlane = z.infer<typeof insertSwimlaneSchema>;
export type Swimlane = typeof swimlanes.$inferSelect;

// Process Types Table (for dynamic type selection)
export const processTypes = pgTable("process_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default('#6B7280'),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProcessTypeSchema = createInsertSchema(processTypes).omit({
  id: true,
  createdAt: true,
});

export const updateProcessTypeSchema = insertProcessTypeSchema.partial();

export type InsertProcessType = z.infer<typeof insertProcessTypeSchema>;
export type UpdateProcessType = z.infer<typeof updateProcessTypeSchema>;
export type ProcessType = typeof processTypes.$inferSelect;

// Priorities Table (for dynamic priority selection)
export const priorities = pgTable("priorities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  level: integer("level").notNull().default(0), // Higher = more urgent
  color: text("color").default('#6B7280'),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPrioritySchema = createInsertSchema(priorities).omit({
  id: true,
  createdAt: true,
});

export const updatePrioritySchema = insertPrioritySchema.partial();

export type InsertPriority = z.infer<typeof insertPrioritySchema>;
export type UpdatePriority = z.infer<typeof updatePrioritySchema>;
export type Priority = typeof priorities.$inferSelect;

// Dashboard Widget Configuration Table
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  widgetType: text("widget_type").notNull(), // 'process_count', 'status_chart', 'recent_processes', 'deadline_alerts', 'activity_feed', 'priority_chart', 'unit_breakdown', 'cumulative_flow'
  title: text("title").notNull(),
  config: text("config"), // JSON config for widget-specific settings
  position: integer("position").notNull().default(0),
  width: integer("width").notNull().default(1), // 1 = half width, 2 = full width
  height: integer("height").notNull().default(1), // 1 = normal, 2 = tall
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
