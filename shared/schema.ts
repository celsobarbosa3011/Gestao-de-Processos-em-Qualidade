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
  status: text("status").notNull().default('new'), // new, analysis, pending, approved, completed, rejected
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
  backgroundColor: text("background_color").default('#E8EEFF'), // Soft lavender blue
  sidebarBackground: text("sidebar_background").default('#E8EEFF'), // Sidebar lavender blue
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
  columnId: text("column_id").notNull().unique(), // 'new', 'analysis', 'pending', 'approved', 'completed', 'rejected'
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

// ============================================================
// QHEALTH ONE 2026 — MÓDULOS ESPECÍFICOS
// ============================================================

// MÓDULO 2 & 3 — Diagnóstico Institucional + Matriz GUT
export const diagnosticCycles = pgTable("diagnostic_cycles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unitId: integer("unit_id").references(() => units.id),
  status: text("status").notNull().default('draft'), // draft, in_progress, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const insertDiagnosticCycleSchema = createInsertSchema(diagnosticCycles).omit({ id: true, createdAt: true });
export type DiagnosticCycle = typeof diagnosticCycles.$inferSelect;
export type InsertDiagnosticCycle = z.infer<typeof insertDiagnosticCycleSchema>;

export const diagnosticItems = pgTable("diagnostic_items", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => diagnosticCycles.id, { onDelete: 'cascade' }),
  requirementCode: text("requirement_code").notNull(), // e.g. "2.1.3"
  requirementText: text("requirement_text").notNull(),
  chapter: text("chapter").notNull(),
  standard: text("standard"),
  onaLevel: integer("ona_level").notNull().default(1), // 1, 2, 3
  status: text("status").notNull().default('not_evaluated'), // adherent, partial, non_adherent, not_applicable
  comments: text("comments"),
  evidenceUrls: text("evidence_urls").array(),
  evaluatedBy: varchar("evaluated_by").references(() => profiles.id),
  evaluatedAt: timestamp("evaluated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDiagnosticItemSchema = createInsertSchema(diagnosticItems).omit({ id: true, createdAt: true });
export type DiagnosticItem = typeof diagnosticItems.$inferSelect;
export type InsertDiagnosticItem = z.infer<typeof insertDiagnosticItemSchema>;

// Matriz GUT
export const gutItems = pgTable("gut_items", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").references(() => diagnosticCycles.id),
  title: text("title").notNull(),
  description: text("description"),
  origin: text("origin").notNull().default('diagnostic'), // diagnostic, audit, risk, incident
  originId: integer("origin_id"),
  gravity: integer("gravity").notNull().default(1), // 1-5
  urgency: integer("urgency").notNull().default(1), // 1-5
  tendency: integer("tendency").notNull().default(1), // 1-5
  // score = gravity * urgency * tendency (max 125)
  unitId: integer("unit_id").references(() => units.id),
  responsibleId: varchar("responsible_id").references(() => profiles.id),
  status: text("status").notNull().default('open'), // open, in_progress, resolved
  aiJustification: text("ai_justification"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGutItemSchema = createInsertSchema(gutItems).omit({ id: true, createdAt: true });
export type GutItem = typeof gutItems.$inferSelect;
export type InsertGutItem = z.infer<typeof insertGutItemSchema>;

// MÓDULO 4 — Acreditação ONA 2026
export const onaRequirements = pgTable("ona_requirements", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. "2.1.3.a"
  chapter: text("chapter").notNull(),
  standard: text("standard").notNull(),
  criterion: text("criterion").notNull(),
  subcriterion: text("subcriterion"),
  description: text("description").notNull(),
  onaLevel: integer("ona_level").notNull().default(1), // 1, 2, 3
  category: text("category"), // assistencial, organizacional, etc.
  applicableUnits: text("applicable_units").array(), // unit types this applies to
  mandatory: boolean("mandatory").notNull().default(true),
  order: integer("order").notNull().default(0),
});

export const insertOnaRequirementSchema = createInsertSchema(onaRequirements).omit({ id: true });
export type OnaRequirement = typeof onaRequirements.$inferSelect;

export const onaEvidences = pgTable("ona_evidences", {
  id: serial("id").primaryKey(),
  requirementId: integer("requirement_id").notNull().references(() => onaRequirements.id),
  unitId: integer("unit_id").references(() => units.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default('document'), // document, protocol, indicator, ata, record, training
  fileUrl: text("file_url"),
  status: text("status").notNull().default('valid'), // valid, expired, pending
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  uploadedBy: varchar("uploaded_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOnaEvidenceSchema = createInsertSchema(onaEvidences).omit({ id: true, createdAt: true });
export type OnaEvidence = typeof onaEvidences.$inferSelect;
export type InsertOnaEvidence = z.infer<typeof insertOnaEvidenceSchema>;

export const onaAdherence = pgTable("ona_adherence", {
  id: serial("id").primaryKey(),
  requirementId: integer("requirement_id").notNull().references(() => onaRequirements.id),
  unitId: integer("unit_id").references(() => units.id),
  status: text("status").notNull().default('not_evaluated'), // adherent, partial, non_adherent, not_applicable
  comments: text("comments"),
  aiSuggested: boolean("ai_suggested").notNull().default(false),
  confirmedBy: varchar("confirmed_by").references(() => profiles.id),
  evaluatedAt: timestamp("evaluated_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOnaAdherenceSchema = createInsertSchema(onaAdherence).omit({ id: true, updatedAt: true });
export type OnaAdherence = typeof onaAdherence.$inferSelect;

// MÓDULO 7 — Riscos
export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default('operational'), // operational, assistencial, strategic, regulatory, infrastructure
  unitId: integer("unit_id").references(() => units.id),
  processId: integer("process_id").references(() => processes.id),
  probability: integer("probability").notNull().default(1), // 1-5
  impact: integer("impact").notNull().default(1), // 1-5
  // inherentRisk = probability * impact
  existingControls: text("existing_controls"),
  residualProbability: integer("residual_probability").default(1),
  residualImpact: integer("residual_impact").default(1),
  // residualRisk = residualProbability * residualImpact
  status: text("status").notNull().default('identified'), // identified, analyzing, mitigating, monitored, closed
  responsibleId: varchar("responsible_id").references(() => profiles.id),
  reviewDate: timestamp("review_date"),
  onaRequirementId: integer("ona_requirement_id").references(() => onaRequirements.id),
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true, updatedAt: true });
export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;

export const riskMitigations = pgTable("risk_mitigations", {
  id: serial("id").primaryKey(),
  riskId: integer("risk_id").notNull().references(() => risks.id, { onDelete: 'cascade' }),
  action: text("action").notNull(),
  responsibleId: varchar("responsible_id").references(() => profiles.id),
  deadline: timestamp("deadline"),
  status: text("status").notNull().default('pending'), // pending, in_progress, completed
  evidence: text("evidence"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRiskMitigationSchema = createInsertSchema(riskMitigations).omit({ id: true, createdAt: true });
export type RiskMitigation = typeof riskMitigations.$inferSelect;

// MÓDULO 9 — Comissões
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // NSP, SCIH, SCIH, Prontuarios, Obitos, Etica, Farmacia, Protocolos, Residuos, Humanizacao
  unitId: integer("unit_id").references(() => units.id),
  regimentUrl: text("regiment_url"),
  regulationRef: text("regulation_ref"), // RDC or normative reference
  membersJson: text("members_json"), // JSON array of member profiles
  meetingFrequency: text("meeting_frequency").notNull().default('monthly'),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({ id: true, createdAt: true });
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export const commissionMeetings = pgTable("commission_meetings", {
  id: serial("id").primaryKey(),
  commissionId: integer("commission_id").notNull().references(() => commissions.id, { onDelete: 'cascade' }),
  meetingDate: timestamp("meeting_date").notNull(),
  location: text("location"),
  attendeesJson: text("attendees_json"), // JSON array
  agendaJson: text("agenda_json"), // JSON array of topics
  minutesUrl: text("minutes_url"),
  status: text("status").notNull().default('scheduled'), // scheduled, completed, cancelled
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommissionMeetingSchema = createInsertSchema(commissionMeetings).omit({ id: true, createdAt: true });
export type CommissionMeeting = typeof commissionMeetings.$inferSelect;

export const commissionDeliberations = pgTable("commission_deliberations", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull().references(() => commissionMeetings.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  responsibleId: varchar("responsible_id").references(() => profiles.id),
  deadline: timestamp("deadline"),
  status: text("status").notNull().default('pending'),
  actionPlanId: integer("action_plan_id"), // linked action plan
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommissionDeliberationSchema = createInsertSchema(commissionDeliberations).omit({ id: true, createdAt: true });
export type CommissionDeliberation = typeof commissionDeliberations.$inferSelect;

// MÓDULO 10 — Indicadores
export const indicators = pgTable("indicators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique(),
  description: text("description"),
  layer: text("layer").notNull().default('operational'), // ona, safety, ans, operational, experience
  category: text("category"),
  formula: text("formula"),
  unit: text("unit").notNull().default('%'), // %, n, days, ratio
  frequency: text("frequency").notNull().default('monthly'), // daily, weekly, monthly, quarterly, annual
  target: text("target"), // numeric or JSON with min/max
  targetDirection: text("target_direction").notNull().default('up'), // up (higher=better) or down (lower=better)
  polarityAlert: integer("polarity_alert").notNull().default(0), // threshold for alert
  unitId: integer("unit_id").references(() => units.id), // null = all units
  onaRequirementId: integer("ona_requirement_id").references(() => onaRequirements.id),
  responsibleId: varchar("responsible_id").references(() => profiles.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIndicatorSchema = createInsertSchema(indicators).omit({ id: true, createdAt: true });
export type Indicator = typeof indicators.$inferSelect;
export type InsertIndicator = z.infer<typeof insertIndicatorSchema>;

export const indicatorValues = pgTable("indicator_values", {
  id: serial("id").primaryKey(),
  indicatorId: integer("indicator_id").notNull().references(() => indicators.id, { onDelete: 'cascade' }),
  unitId: integer("unit_id").references(() => units.id),
  period: text("period").notNull(), // e.g. "2026-03", "2026-Q1"
  value: text("value").notNull(), // stored as string to support different units
  target: text("target"),
  numerator: text("numerator"),
  denominator: text("denominator"),
  notes: text("notes"),
  registeredBy: varchar("registered_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIndicatorValueSchema = createInsertSchema(indicatorValues).omit({ id: true, createdAt: true });
export type IndicatorValue = typeof indicatorValues.$inferSelect;

// MÓDULO 15 — Documentos & Evidências
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  code: text("code").unique(),
  title: text("title").notNull(),
  type: text("type").notNull().default('POP'), // POP, Protocol, Policy, Manual, Norm, Form, Regulation
  category: text("category"),
  unitId: integer("unit_id").references(() => units.id),
  status: text("status").notNull().default('draft'), // draft, review, approved, obsolete
  currentVersion: text("current_version").notNull().default('1.0'),
  fileUrl: text("file_url"),
  approvedBy: varchar("approved_by").references(() => profiles.id),
  approvedAt: timestamp("approved_at"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  reviewPeriodDays: integer("review_period_days").notNull().default(365),
  mandatoryReading: boolean("mandatory_reading").notNull().default(false),
  onaRequirementId: integer("ona_requirement_id").references(() => onaRequirements.id),
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export const documentReadings = pgTable("document_readings", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  readAt: timestamp("read_at").notNull().defaultNow(),
  version: text("version").notNull(),
});

export type DocumentReading = typeof documentReadings.$inferSelect;

// MÓDULO 17 — Gestão Operacional (Planos de Ação)
export const actionPlans = pgTable("action_plans", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  origin: text("origin").notNull().default('manual'), // diagnostic, ona, gut, risk, commission, audit, indicator, protocol, manual
  originId: integer("origin_id"),
  unitId: integer("unit_id").references(() => units.id),
  responsibleId: varchar("responsible_id").references(() => profiles.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default('pending'), // pending, in_progress, completed, overdue, cancelled
  priority: text("priority").notNull().default('medium'), // low, medium, high, critical
  effectiveness: text("effectiveness"), // confirmed, not_confirmed, pending
  effectivenessNotes: text("effectiveness_notes"),
  onaRequirementId: integer("ona_requirement_id").references(() => onaRequirements.id),
  riskId: integer("risk_id").references(() => risks.id),
  evidenceUrls: text("evidence_urls").array(),
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertActionPlanSchema = createInsertSchema(actionPlans).omit({ id: true, createdAt: true, updatedAt: true });
export type ActionPlan = typeof actionPlans.$inferSelect;
export type InsertActionPlan = z.infer<typeof insertActionPlanSchema>;

export const actionPlanTasks = pgTable("action_plan_tasks", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => actionPlans.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  order: integer("order").notNull().default(0),
});

export type ActionPlanTask = typeof actionPlanTasks.$inferSelect;

// MÓDULO 20 — Notificação de Eventos (RDC 63 + Notivisa)
export const safetyEvents = pgTable("safety_events", {
  id: serial("id").primaryKey(),
  code: text("code").unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default('adverse_event'), // near_miss, adverse_event, sentinel
  severity: text("severity").notNull().default('low'), // low, moderate, severe, death
  unitId: integer("unit_id").references(() => units.id),
  occurrenceDate: timestamp("occurrence_date").notNull(),
  reportedBy: varchar("reported_by").references(() => profiles.id),
  patientAge: integer("patient_age"),
  anonymousPatient: boolean("anonymous_patient").notNull().default(true),
  notivisaRequired: boolean("notivisa_required").notNull().default(false),
  notivisaSentAt: timestamp("notivisa_sent_at"),
  rdc63Category: text("rdc63_category"),
  rootCause: text("root_cause"),
  causeAnalysis: text("cause_analysis"), // JSON Ishikawa
  capaGenerated: boolean("capa_generated").notNull().default(false),
  actionPlanId: integer("action_plan_id").references(() => actionPlans.id),
  status: text("status").notNull().default('reported'), // reported, analyzing, action_plan, closed
  regulatoryDeadline: timestamp("regulatory_deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSafetyEventSchema = createInsertSchema(safetyEvents).omit({ id: true, createdAt: true, updatedAt: true });
export type SafetyEvent = typeof safetyEvents.$inferSelect;
export type InsertSafetyEvent = z.infer<typeof insertSafetyEventSchema>;

// MÓDULO 12 — Protocolos Gerenciados
export const managedProtocols = pgTable("managed_protocols", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique(),
  type: text("type").notNull(), // sepse, avc, dor_toracica, tev, contencao, suicidio, custom
  description: text("description"),
  version: text("version").notNull().default('1.0'),
  status: text("status").notNull().default('active'), // draft, active, review, obsolete
  fileUrl: text("file_url"),
  flowUrl: text("flow_url"), // Bizagi/BPMN
  unitId: integer("unit_id").references(() => units.id),
  adherenceTarget: integer("adherence_target").notNull().default(90), // target %
  onaRequirementId: integer("ona_requirement_id").references(() => onaRequirements.id),
  reviewDate: timestamp("review_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertManagedProtocolSchema = createInsertSchema(managedProtocols).omit({ id: true, createdAt: true, updatedAt: true });
export type ManagedProtocol = typeof managedProtocols.$inferSelect;

// MÓDULO 16 — Treinamentos
export const trainings = pgTable("trainings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default('online'), // online, presential, hybrid
  targetRoles: text("target_roles").array(),
  targetUnitId: integer("target_unit_id").references(() => units.id),
  contentUrl: text("content_url"),
  preTestEnabled: boolean("pre_test_enabled").notNull().default(false),
  postTestEnabled: boolean("post_test_enabled").notNull().default(true),
  minimumScore: integer("minimum_score").notNull().default(70),
  validityDays: integer("validity_days").notNull().default(365),
  certificateEnabled: boolean("certificate_enabled").notNull().default(true),
  protocolId: integer("protocol_id").references(() => managedProtocols.id),
  documentId: integer("document_id").references(() => documents.id),
  onaRequirementId: integer("ona_requirement_id").references(() => onaRequirements.id),
  active: boolean("active").notNull().default(true),
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrainingSchema = createInsertSchema(trainings).omit({ id: true, createdAt: true });
export type Training = typeof trainings.$inferSelect;

// MÓDULO 19 — Referências Normativas
export const normativeReferences = pgTable("normative_references", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(), // e.g., "RDC 63/2011"
  title: text("title").notNull(),
  type: text("type").notNull().default('RDC'), // RDC, Portaria, Resolucao, ABNT, CFM, Manual
  issuer: text("issuer").notNull().default('ANVISA'),
  publicationDate: timestamp("publication_date"),
  effectiveDate: timestamp("effective_date"),
  summary: text("summary"),
  fileUrl: text("file_url"),
  externalUrl: text("external_url"),
  tags: text("tags").array(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type NormativeReference = typeof normativeReferences.$inferSelect;

// ============================================================
// MÓDULO — Análise SWOT
// ============================================================
export const swotAnalyses = pgTable("swot_analyses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  unitId: integer("unit_id").references(() => units.id),
  period: text("period").notNull().default('2026'),
  status: text("status").notNull().default('draft'), // draft, completed
  createdBy: varchar("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSwotAnalysisSchema = createInsertSchema(swotAnalyses).omit({ id: true, createdAt: true, updatedAt: true });
export type SwotAnalysis = typeof swotAnalyses.$inferSelect;
export type InsertSwotAnalysis = z.infer<typeof insertSwotAnalysisSchema>;

export const swotItems = pgTable("swot_items", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").notNull().references(() => swotAnalyses.id, { onDelete: 'cascade' }),
  quadrant: text("quadrant").notNull(), // strength, weakness, opportunity, threat
  description: text("description").notNull(),
  impact: text("impact").notNull().default('medium'), // low, medium, high
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSwotItemSchema = createInsertSchema(swotItems).omit({ id: true, createdAt: true });
export type SwotItem = typeof swotItems.$inferSelect;
export type InsertSwotItem = z.infer<typeof insertSwotItemSchema>;

// ============================================================
// MÓDULO — Planejamento BSC
// ============================================================
export const bscPerspectives = pgTable("bsc_perspectives", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(), // financial, customer, internal, learning
  color: text("color").notNull().default('#3B82F6'),
  unitId: integer("unit_id").references(() => units.id),
  order: integer("order").notNull().default(0),
});

export const bscObjectives = pgTable("bsc_objectives", {
  id: serial("id").primaryKey(),
  perspectiveId: integer("perspective_id").notNull().references(() => bscPerspectives.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  target: text("target"),
  currentValue: text("current_value"),
  unit: text("unit").notNull().default('%'),
  status: text("status").notNull().default('on_track'), // on_track, at_risk, behind, achieved
  responsible: text("responsible"),
  deadline: timestamp("deadline"),
  weight: integer("weight").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBscObjectiveSchema = createInsertSchema(bscObjectives).omit({ id: true, createdAt: true, updatedAt: true });
export type BscPerspective = typeof bscPerspectives.$inferSelect;
export type BscObjective = typeof bscObjectives.$inferSelect;
export type InsertBscObjective = z.infer<typeof insertBscObjectiveSchema>;

// ============================================================
// MÓDULO — Políticas & Regimentos (reusa tabela documents com type='Policy'|'Regulation')
// Tabela de itens de jornada do paciente
// ============================================================
export const patientJourneySteps = pgTable("patient_journey_steps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phase: text("phase").notNull(), // admission, triage, diagnosis, treatment, discharge, followup
  description: text("description"),
  responsible: text("responsible"),
  avgDurationMinutes: integer("avg_duration_minutes").notNull().default(30),
  slaMinutes: integer("sla_minutes").notNull().default(60),
  status: text("status").notNull().default('active'),
  bottleneck: boolean("bottleneck").notNull().default(false),
  unitId: integer("unit_id").references(() => units.id),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPatientJourneyStepSchema = createInsertSchema(patientJourneySteps).omit({ id: true, createdAt: true });
export type PatientJourneyStep = typeof patientJourneySteps.$inferSelect;
export type InsertPatientJourneyStep = z.infer<typeof insertPatientJourneyStepSchema>;
