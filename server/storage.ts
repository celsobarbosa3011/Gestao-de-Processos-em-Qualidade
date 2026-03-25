import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  Profile,
  InsertProfile,
  Process,
  InsertProcess,
  UpdateProcess,
  ProcessComment,
  InsertProcessComment,
  ProcessEvent,
  InsertProcessEvent,
  AlertSettings,
  UpdateAlertSettings,
  BrandingConfig,
  UpdateBrandingConfig,
  WipLimit,
  InsertWipLimit,
  UpdateWipLimit,
  ProcessChecklist,
  InsertProcessChecklist,
  ProcessAttachment,
  InsertProcessAttachment,
  ProcessLabel,
  InsertProcessLabel,
  ProcessToLabel,
  ChatMessage,
  InsertChatMessage,
  Permission,
  InsertPermission,
  RolePermission,
  UserPermission,
  ProcessTemplate,
  InsertProcessTemplate,
  FeatureToggle,
  TimeEntry,
  InsertTimeEntry,
  CustomField,
  InsertCustomField,
  CustomFieldValue,
  InsertCustomFieldValue,
  Automation,
  InsertAutomation,
  Notification,
  InsertNotification,
  Swimlane,
  InsertSwimlane,
  DashboardWidget,
  InsertDashboardWidget,
  Unit,
  InsertUnit,
  UpdateUnit,
  ProcessType,
  InsertProcessType,
  UpdateProcessType,
  Priority,
  InsertPriority,
  UpdatePriority,
} from "@shared/schema";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import path from "path";

// Initialize database: use real PostgreSQL when DATABASE_URL is set (production),
// otherwise fall back to PGlite for local dev
function createDb(): any {
  if (process.env.DATABASE_URL) {
    console.log('[db] Using PostgreSQL (DATABASE_URL is set)');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return drizzlePg(pool, { schema });
  } else {
    console.log('[db] Using PGlite (no DATABASE_URL — local dev mode)');
    const client = new PGlite("./data");
    return drizzlePglite(client, { schema });
  }
}

export const db = createDb();

// Helper to run migrations on startup
export async function runMigrations() {
  const migrationsFolder = path.join(process.cwd(), "migrations");
  if (!process.env.DATABASE_URL) {
    console.log('[db] Running PGlite migrations...');
    await migratePglite(db, { migrationsFolder });
    console.log('[db] PGlite migrations completed');
  } else {
    console.log('[db] Running PostgreSQL migrations...');
    await migratePg(db, { migrationsFolder });
    console.log('[db] PostgreSQL migrations completed');
  }
}


export interface IStorage {
  // Profile/User methods
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: string): Promise<boolean>;
  getAllProfiles(): Promise<Profile[]>;

  // Process methods
  getProcess(id: number): Promise<Process | undefined>;
  getProcessesByUser(userId: string): Promise<Process[]>;
  getAllProcesses(): Promise<Process[]>;
  createProcess(process: InsertProcess): Promise<Process>;
  updateProcess(id: number, updates: UpdateProcess): Promise<Process | undefined>;

  // Process Comments methods
  getCommentsByProcess(processId: number): Promise<ProcessComment[]>;
  createComment(comment: InsertProcessComment): Promise<ProcessComment>;

  // Process Events methods
  getEventsByProcess(processId: number): Promise<ProcessEvent[]>;
  getAllEvents(): Promise<ProcessEvent[]>;
  createEvent(event: InsertProcessEvent): Promise<ProcessEvent>;

  // Alert Settings methods
  getAlertSettings(): Promise<AlertSettings | undefined>;
  updateAlertSettings(settings: UpdateAlertSettings): Promise<AlertSettings>;

  // Branding Config methods
  getBrandingConfig(): Promise<BrandingConfig>;
  updateBrandingConfig(config: UpdateBrandingConfig): Promise<BrandingConfig>;

  // WIP Limits methods
  getAllWipLimits(): Promise<WipLimit[]>;
  getWipLimit(columnId: string): Promise<WipLimit | undefined>;
  upsertWipLimit(columnId: string, updates: UpdateWipLimit): Promise<WipLimit>;

  // Checklist methods
  getChecklistsByProcess(processId: number): Promise<ProcessChecklist[]>;
  createChecklist(checklist: InsertProcessChecklist): Promise<ProcessChecklist>;
  updateChecklist(id: number, completed: boolean): Promise<ProcessChecklist | undefined>;
  deleteChecklist(id: number): Promise<boolean>;

  // Attachment methods
  getAttachmentsByProcess(processId: number): Promise<ProcessAttachment[]>;
  getAttachment(id: number): Promise<ProcessAttachment | null>;
  createAttachment(attachment: InsertProcessAttachment): Promise<ProcessAttachment>;
  deleteAttachment(id: number): Promise<boolean>;

  // Label methods
  getAllLabels(): Promise<ProcessLabel[]>;
  createLabel(label: InsertProcessLabel): Promise<ProcessLabel>;
  deleteLabel(id: number): Promise<boolean>;
  getLabelsByProcess(processId: number): Promise<ProcessLabel[]>;
  addLabelToProcess(processId: number, labelId: number): Promise<ProcessToLabel>;
  removeLabelFromProcess(processId: number, labelId: number): Promise<boolean>;

  // Chat methods
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  getChatConversation(userId1: string, userId2: string): Promise<ChatMessage[]>;
  getUserConversations(userId: string): Promise<{
    otherUserId: string;
    otherUserName: string;
    otherUserUnit: string;
    lastMessage: string;
    lastMessageSenderId: string;
    lastMessageSenderName: string;
    lastMessageAt: Date;
    unreadCount: number;
  }[]>;
  sendChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;

  // Permission methods
  getAllPermissions(): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  getRolePermissions(role: string): Promise<RolePermission[]>;
  setRolePermission(role: string, permissionKey: string): Promise<RolePermission>;
  removeRolePermission(role: string, permissionKey: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  setUserPermission(userId: string, permissionKey: string, granted: boolean): Promise<UserPermission>;

  // Template methods
  getAllTemplates(): Promise<ProcessTemplate[]>;
  createTemplate(template: InsertProcessTemplate): Promise<ProcessTemplate>;
  updateTemplate(id: number, updates: Partial<InsertProcessTemplate>): Promise<ProcessTemplate | undefined>;
  deleteTemplate(id: number): Promise<boolean>;

  // Feature Toggle methods
  getAllFeatureToggles(): Promise<FeatureToggle[]>;
  updateFeatureToggle(featureKey: string, enabled: boolean): Promise<FeatureToggle>;

  // Unit methods
  getAllUnits(): Promise<Unit[]>;
  getUnit(id: number): Promise<Unit | undefined>;
  getUnitByCnpj(cnpj: string): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: number, updates: UpdateUnit): Promise<Unit | undefined>;
  deleteUnit(id: number): Promise<boolean>;

  // Process Type methods
  getAllProcessTypes(): Promise<ProcessType[]>;
  getProcessType(id: number): Promise<ProcessType | undefined>;
  createProcessType(type: InsertProcessType): Promise<ProcessType>;
  updateProcessType(id: number, updates: UpdateProcessType): Promise<ProcessType | undefined>;
  deleteProcessType(id: number): Promise<boolean>;

  // Priority methods
  getAllPriorities(): Promise<Priority[]>;
  getPriority(id: number): Promise<Priority | undefined>;
  createPriority(priority: InsertPriority): Promise<Priority>;
  updatePriority(id: number, updates: UpdatePriority): Promise<Priority | undefined>;
  deletePriority(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Profile methods
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    // Case-insensitive email search to handle different devices/keyboards
    const result = await db.select().from(schema.profiles).where(sql`LOWER(${schema.profiles.email}) = LOWER(${email})`).limit(1);
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(schema.profiles).values(profile).returning();
    return result[0];
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const result = await db.update(schema.profiles).set(updates).where(eq(schema.profiles.id, id)).returning();
    return result[0];
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await db.select().from(schema.profiles);
  }

  async deleteProfile(id: string): Promise<boolean> {
    const result = await db.delete(schema.profiles).where(eq(schema.profiles.id, id)).returning();
    return result.length > 0;
  }

  // Process methods
  async getProcess(id: number): Promise<Process | undefined> {
    const result = await db.select().from(schema.processes).where(eq(schema.processes.id, id)).limit(1);
    return result[0];
  }

  async getProcessesByUser(userId: string): Promise<Process[]> {
    return await db.select().from(schema.processes).where(eq(schema.processes.responsibleId, userId));
  }

  async getAllProcesses(): Promise<Process[]> {
    return await db.select().from(schema.processes).orderBy(desc(schema.processes.createdAt));
  }

  async createProcess(process: InsertProcess): Promise<Process> {
    const data = { ...process };
    if (data.deadline && typeof data.deadline === 'string') {
      data.deadline = new Date(data.deadline);
    }
    const result = await db.insert(schema.processes).values(data).returning();
    return result[0];
  }

  async updateProcess(id: number, updates: UpdateProcess): Promise<Process | undefined> {
    const result = await db.update(schema.processes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.processes.id, id))
      .returning();
    return result[0];
  }

  // Comment methods
  async getCommentsByProcess(processId: number): Promise<ProcessComment[]> {
    return await db.select().from(schema.processComments)
      .where(eq(schema.processComments.processId, processId))
      .orderBy(schema.processComments.createdAt);
  }

  async createComment(comment: InsertProcessComment): Promise<ProcessComment> {
    const result = await db.insert(schema.processComments).values(comment).returning();
    return result[0];
  }

  // Event methods
  async getEventsByProcess(processId: number): Promise<ProcessEvent[]> {
    return await db.select().from(schema.processEvents)
      .where(eq(schema.processEvents.processId, processId))
      .orderBy(schema.processEvents.timestamp);
  }

  async getAllEvents(): Promise<ProcessEvent[]> {
    return await db.select().from(schema.processEvents).orderBy(desc(schema.processEvents.timestamp));
  }

  async createEvent(event: InsertProcessEvent): Promise<ProcessEvent> {
    const result = await db.insert(schema.processEvents).values(event).returning();
    return result[0];
  }

  // Alert Settings methods
  async getAlertSettings(): Promise<AlertSettings | undefined> {
    const result = await db.select().from(schema.alertSettings).limit(1);
    if (result.length === 0) {
      // Create default settings if none exist
      const defaultSettings = await db.insert(schema.alertSettings)
        .values({ warningDays: 5, criticalDays: 2, stalledDays: 15 })
        .returning();
      return defaultSettings[0];
    }
    return result[0];
  }

  async updateAlertSettings(settings: UpdateAlertSettings): Promise<AlertSettings> {
    const existing = await this.getAlertSettings();
    if (!existing) {
      const result = await db.insert(schema.alertSettings).values(settings).returning();
      return result[0];
    }
    const result = await db.update(schema.alertSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(schema.alertSettings.id, existing.id))
      .returning();
    return result[0];
  }

  // Branding Config methods
  async getBrandingConfig(): Promise<BrandingConfig> {
    const result = await db.select().from(schema.brandingConfig).limit(1);
    if (result.length === 0) {
      // Create default branding if none exists
      const defaultBranding = await db.insert(schema.brandingConfig)
        .values({})
        .returning();
      return defaultBranding[0];
    }
    return result[0];
  }

  async updateBrandingConfig(config: UpdateBrandingConfig): Promise<BrandingConfig> {
    const existing = await this.getBrandingConfig();
    const result = await db.update(schema.brandingConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(schema.brandingConfig.id, existing.id))
      .returning();
    return result[0];
  }

  // WIP Limits methods
  async getAllWipLimits(): Promise<WipLimit[]> {
    return await db.select().from(schema.wipLimits);
  }

  async getWipLimit(columnId: string): Promise<WipLimit | undefined> {
    const result = await db.select().from(schema.wipLimits)
      .where(eq(schema.wipLimits.columnId, columnId))
      .limit(1);
    return result[0];
  }

  async upsertWipLimit(columnId: string, updates: UpdateWipLimit): Promise<WipLimit> {
    const existing = await this.getWipLimit(columnId);
    if (existing) {
      const result = await db.update(schema.wipLimits)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(schema.wipLimits.columnId, columnId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(schema.wipLimits)
        .values({ columnId, ...updates })
        .returning();
      return result[0];
    }
  }

  // Checklist methods
  async getChecklistsByProcess(processId: number): Promise<ProcessChecklist[]> {
    return await db.select().from(schema.processChecklists)
      .where(eq(schema.processChecklists.processId, processId))
      .orderBy(schema.processChecklists.createdAt);
  }

  async createChecklist(checklist: InsertProcessChecklist): Promise<ProcessChecklist> {
    const result = await db.insert(schema.processChecklists).values(checklist).returning();
    return result[0];
  }

  async updateChecklist(id: number, completed: boolean): Promise<ProcessChecklist | undefined> {
    const result = await db.update(schema.processChecklists)
      .set({ completed })
      .where(eq(schema.processChecklists.id, id))
      .returning();
    return result[0];
  }

  async deleteChecklist(id: number): Promise<boolean> {
    const result = await db.delete(schema.processChecklists)
      .where(eq(schema.processChecklists.id, id))
      .returning();
    return result.length > 0;
  }

  // Attachment methods
  async getAttachmentsByProcess(processId: number): Promise<ProcessAttachment[]> {
    return await db.select().from(schema.processAttachments)
      .where(eq(schema.processAttachments.processId, processId))
      .orderBy(desc(schema.processAttachments.createdAt));
  }

  async getAttachment(id: number): Promise<ProcessAttachment | null> {
    const result = await db.select().from(schema.processAttachments)
      .where(eq(schema.processAttachments.id, id))
      .limit(1);
    return result[0] || null;
  }

  async createAttachment(attachment: InsertProcessAttachment): Promise<ProcessAttachment> {
    const result = await db.insert(schema.processAttachments).values(attachment).returning();
    return result[0];
  }

  async deleteAttachment(id: number): Promise<boolean> {
    const result = await db.delete(schema.processAttachments)
      .where(eq(schema.processAttachments.id, id))
      .returning();
    return result.length > 0;
  }

  // Label methods
  async getAllLabels(): Promise<ProcessLabel[]> {
    return await db.select().from(schema.processLabels);
  }

  async createLabel(label: InsertProcessLabel): Promise<ProcessLabel> {
    const result = await db.insert(schema.processLabels).values(label).returning();
    return result[0];
  }

  async deleteLabel(id: number): Promise<boolean> {
    const result = await db.delete(schema.processLabels)
      .where(eq(schema.processLabels.id, id))
      .returning();
    return result.length > 0;
  }

  async getLabelsByProcess(processId: number): Promise<ProcessLabel[]> {
    const junctions = await db.select()
      .from(schema.processToLabels)
      .where(eq(schema.processToLabels.processId, processId));

    if (junctions.length === 0) return [];

    const labelIds = junctions.map(j => j.labelId);
    const labels = await db.select()
      .from(schema.processLabels)
      .where(sql`${schema.processLabels.id} = ANY(ARRAY[${sql.join(labelIds, sql`, `)}]::integer[])`);

    return labels;
  }

  async addLabelToProcess(processId: number, labelId: number): Promise<ProcessToLabel> {
    const result = await db.insert(schema.processToLabels)
      .values({ processId, labelId })
      .returning();
    return result[0];
  }

  async removeLabelFromProcess(processId: number, labelId: number): Promise<boolean> {
    const result = await db.delete(schema.processToLabels)
      .where(and(
        eq(schema.processToLabels.processId, processId),
        eq(schema.processToLabels.labelId, labelId)
      ))
      .returning();
    return result.length > 0;
  }

  // Chat methods
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return await db.select().from(schema.chatMessages)
      .where(sql`${schema.chatMessages.senderId} = ${userId} OR ${schema.chatMessages.receiverId} = ${userId} OR ${schema.chatMessages.receiverId} IS NULL`)
      .orderBy(desc(schema.chatMessages.createdAt));
  }

  async getChatConversation(userId1: string, userId2: string): Promise<ChatMessage[]> {
    return await db.select().from(schema.chatMessages)
      .where(sql`(${schema.chatMessages.senderId} = ${userId1} AND ${schema.chatMessages.receiverId} = ${userId2}) OR (${schema.chatMessages.senderId} = ${userId2} AND ${schema.chatMessages.receiverId} = ${userId1})`)
      .orderBy(schema.chatMessages.createdAt);
  }

  async sendChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(schema.chatMessages).values(message).returning();
    return result[0];
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db.update(schema.chatMessages)
      .set({ isRead: true })
      .where(and(
        eq(schema.chatMessages.senderId, senderId),
        eq(schema.chatMessages.receiverId, receiverId)
      ));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(schema.chatMessages)
      .where(and(
        eq(schema.chatMessages.receiverId, userId),
        eq(schema.chatMessages.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  async getUserConversations(userId: string): Promise<{
    otherUserId: string;
    otherUserName: string;
    otherUserUnit: string;
    lastMessage: string;
    lastMessageSenderId: string;
    lastMessageSenderName: string;
    lastMessageAt: Date;
    unreadCount: number;
  }[]> {
    // Get all messages where the user is involved (as sender or receiver)
    const messages = await db.select()
      .from(schema.chatMessages)
      .where(sql`(${schema.chatMessages.senderId} = ${userId} OR ${schema.chatMessages.receiverId} = ${userId}) AND ${schema.chatMessages.receiverId} IS NOT NULL`)
      .orderBy(desc(schema.chatMessages.createdAt));

    // Get all profiles for name lookup
    const profiles = await db.select().from(schema.profiles);
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Group by conversation partner and get latest message
    const conversationMap = new Map<string, {
      otherUserId: string;
      otherUserName: string;
      otherUserUnit: string;
      lastMessage: string;
      lastMessageSenderId: string;
      lastMessageSenderName: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId! : msg.senderId;

      if (!conversationMap.has(otherUserId)) {
        const otherProfile = profileMap.get(otherUserId);
        const senderProfile = profileMap.get(msg.senderId);

        conversationMap.set(otherUserId, {
          otherUserId,
          otherUserName: otherProfile?.name || 'Usuário Desconhecido',
          otherUserUnit: otherProfile?.unit || '',
          lastMessage: msg.message,
          lastMessageSenderId: msg.senderId,
          lastMessageSenderName: senderProfile?.name || 'Usuário Desconhecido',
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }

      // Count unread messages from the other user
      if (msg.senderId === otherUserId && msg.receiverId === userId && !msg.isRead) {
        const conv = conversationMap.get(otherUserId)!;
        conv.unreadCount++;
      }
    }

    return Array.from(conversationMap.values());
  }

  // Permission methods
  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(schema.permissions);
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const result = await db.insert(schema.permissions).values(permission).returning();
    return result[0];
  }

  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return await db.select().from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.role, role));
  }

  async setRolePermission(role: string, permissionKey: string): Promise<RolePermission> {
    const result = await db.insert(schema.rolePermissions)
      .values({ role, permissionKey })
      .returning();
    return result[0];
  }

  async removeRolePermission(role: string, permissionKey: string): Promise<boolean> {
    const result = await db.delete(schema.rolePermissions)
      .where(and(
        eq(schema.rolePermissions.role, role),
        eq(schema.rolePermissions.permissionKey, permissionKey)
      ))
      .returning();
    return result.length > 0;
  }

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return await db.select().from(schema.userPermissions)
      .where(eq(schema.userPermissions.userId, userId));
  }

  async setUserPermission(userId: string, permissionKey: string, granted: boolean): Promise<UserPermission> {
    const existing = await db.select().from(schema.userPermissions)
      .where(and(
        eq(schema.userPermissions.userId, userId),
        eq(schema.userPermissions.permissionKey, permissionKey)
      ))
      .limit(1);

    if (existing.length > 0) {
      const result = await db.update(schema.userPermissions)
        .set({ granted })
        .where(eq(schema.userPermissions.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await db.insert(schema.userPermissions)
      .values({ userId, permissionKey, granted })
      .returning();
    return result[0];
  }

  // Template methods
  async getAllTemplates(): Promise<ProcessTemplate[]> {
    return await db.select().from(schema.processTemplates)
      .orderBy(schema.processTemplates.name);
  }

  async createTemplate(template: InsertProcessTemplate): Promise<ProcessTemplate> {
    const result = await db.insert(schema.processTemplates).values(template).returning();
    return result[0];
  }

  async updateTemplate(id: number, updates: Partial<InsertProcessTemplate>): Promise<ProcessTemplate | undefined> {
    const result = await db.update(schema.processTemplates)
      .set(updates)
      .where(eq(schema.processTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(schema.processTemplates)
      .where(eq(schema.processTemplates.id, id))
      .returning();
    return result.length > 0;
  }

  // Feature Toggle methods
  async getAllFeatureToggles(): Promise<FeatureToggle[]> {
    return await db.select().from(schema.featureToggles);
  }

  async updateFeatureToggle(featureKey: string, enabled: boolean): Promise<FeatureToggle> {
    const existing = await db.select().from(schema.featureToggles)
      .where(eq(schema.featureToggles.featureKey, featureKey))
      .limit(1);

    if (existing.length > 0) {
      const result = await db.update(schema.featureToggles)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(schema.featureToggles.featureKey, featureKey))
        .returning();
      return result[0];
    }

    const result = await db.insert(schema.featureToggles)
      .values({ featureKey, name: featureKey, enabled })
      .returning();
    return result[0];
  }

  // Time Entry methods
  async getTimeEntriesByProcess(processId: number): Promise<TimeEntry[]> {
    return await db.select().from(schema.timeEntries)
      .where(eq(schema.timeEntries.processId, processId))
      .orderBy(desc(schema.timeEntries.date));
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const result = await db.insert(schema.timeEntries).values(entry).returning();
    return result[0];
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const result = await db.delete(schema.timeEntries)
      .where(eq(schema.timeEntries.id, id))
      .returning();
    return result.length > 0;
  }

  async getTotalTimeByProcess(processId: number): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${schema.timeEntries.minutes}), 0)` })
      .from(schema.timeEntries)
      .where(eq(schema.timeEntries.processId, processId));
    return result[0]?.total || 0;
  }

  // Custom Field methods
  async getAllCustomFields(): Promise<CustomField[]> {
    return await db.select().from(schema.customFields)
      .orderBy(schema.customFields.order);
  }

  async createCustomField(field: InsertCustomField): Promise<CustomField> {
    const result = await db.insert(schema.customFields).values(field).returning();
    return result[0];
  }

  async updateCustomField(id: number, updates: Partial<InsertCustomField>): Promise<CustomField | undefined> {
    const result = await db.update(schema.customFields)
      .set(updates)
      .where(eq(schema.customFields.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomField(id: number): Promise<boolean> {
    const result = await db.delete(schema.customFields)
      .where(eq(schema.customFields.id, id))
      .returning();
    return result.length > 0;
  }

  async getCustomFieldValues(processId: number): Promise<CustomFieldValue[]> {
    return await db.select().from(schema.customFieldValues)
      .where(eq(schema.customFieldValues.processId, processId));
  }

  async setCustomFieldValue(processId: number, fieldId: number, value: string | null): Promise<CustomFieldValue> {
    const existing = await db.select().from(schema.customFieldValues)
      .where(and(
        eq(schema.customFieldValues.processId, processId),
        eq(schema.customFieldValues.fieldId, fieldId)
      ))
      .limit(1);

    if (existing.length > 0) {
      const result = await db.update(schema.customFieldValues)
        .set({ value })
        .where(eq(schema.customFieldValues.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await db.insert(schema.customFieldValues)
      .values({ processId, fieldId, value })
      .returning();
    return result[0];
  }

  // Automation methods
  async getAllAutomations(): Promise<Automation[]> {
    return await db.select().from(schema.automations)
      .orderBy(schema.automations.name);
  }

  async createAutomation(automation: InsertAutomation): Promise<Automation> {
    const result = await db.insert(schema.automations).values(automation).returning();
    return result[0];
  }

  async updateAutomation(id: number, updates: Partial<InsertAutomation>): Promise<Automation | undefined> {
    const result = await db.update(schema.automations)
      .set(updates)
      .where(eq(schema.automations.id, id))
      .returning();
    return result[0];
  }

  async deleteAutomation(id: number): Promise<boolean> {
    const result = await db.delete(schema.automations)
      .where(eq(schema.automations.id, id))
      .returning();
    return result.length > 0;
  }

  async getEnabledAutomations(): Promise<Automation[]> {
    return await db.select().from(schema.automations)
      .where(eq(schema.automations.enabled, true));
  }

  // Notification methods
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(schema.notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(schema.notifications)
      .where(eq(schema.notifications.id, id))
      .returning();
    return result.length > 0;
  }

  // Swimlane methods
  async getAllSwimlanes(): Promise<Swimlane[]> {
    return await db.select().from(schema.swimlanes)
      .orderBy(schema.swimlanes.order);
  }

  async createSwimlane(swimlane: InsertSwimlane): Promise<Swimlane> {
    const result = await db.insert(schema.swimlanes).values(swimlane).returning();
    return result[0];
  }

  async updateSwimlane(id: number, updates: Partial<InsertSwimlane>): Promise<Swimlane | undefined> {
    const result = await db.update(schema.swimlanes)
      .set(updates)
      .where(eq(schema.swimlanes.id, id))
      .returning();
    return result[0];
  }

  async deleteSwimlane(id: number): Promise<boolean> {
    const result = await db.delete(schema.swimlanes)
      .where(eq(schema.swimlanes.id, id))
      .returning();
    return result.length > 0;
  }

  async getActiveSwimlane(): Promise<Swimlane | undefined> {
    const result = await db.select().from(schema.swimlanes)
      .where(eq(schema.swimlanes.enabled, true))
      .limit(1);
    return result[0];
  }

  // Analytics methods for Cumulative Flow
  async getProcessCountByStatusAndDate(): Promise<{ status: string; date: string; count: number }[]> {
    const result = await db.select({
      status: schema.processes.status,
      date: sql<string>`DATE(${schema.processes.createdAt})`,
      count: sql<number>`count(*)`,
    })
      .from(schema.processes)
      .groupBy(schema.processes.status, sql`DATE(${schema.processes.createdAt})`)
      .orderBy(sql`DATE(${schema.processes.createdAt})`);
    return result;
  }

  // Dashboard Widget methods
  async getDashboardWidgets(userId: string): Promise<DashboardWidget[]> {
    return await db.select().from(schema.dashboardWidgets)
      .where(eq(schema.dashboardWidgets.userId, userId))
      .orderBy(schema.dashboardWidgets.position);
  }

  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const result = await db.insert(schema.dashboardWidgets).values(widget).returning();
    return result[0];
  }

  async updateDashboardWidget(id: number, updates: Partial<InsertDashboardWidget>): Promise<DashboardWidget | undefined> {
    const result = await db.update(schema.dashboardWidgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.dashboardWidgets.id, id))
      .returning();
    return result[0];
  }

  async deleteDashboardWidget(id: number): Promise<boolean> {
    const result = await db.delete(schema.dashboardWidgets)
      .where(eq(schema.dashboardWidgets.id, id))
      .returning();
    return result.length > 0;
  }

  async updateWidgetPositions(userId: string, positions: { id: number; position: number }[]): Promise<void> {
    for (const { id, position } of positions) {
      await db.update(schema.dashboardWidgets)
        .set({ position, updatedAt: new Date() })
        .where(and(
          eq(schema.dashboardWidgets.id, id),
          eq(schema.dashboardWidgets.userId, userId)
        ));
    }
  }

  async initializeDefaultWidgets(userId: string): Promise<DashboardWidget[]> {
    const defaultWidgets: InsertDashboardWidget[] = [
      { userId, widgetType: 'process_count', title: 'Total de Processos', position: 0, width: 1, height: 1, visible: true },
      { userId, widgetType: 'status_chart', title: 'Por Status', position: 1, width: 1, height: 1, visible: true },
      { userId, widgetType: 'priority_chart', title: 'Por Prioridade', position: 2, width: 1, height: 1, visible: true },
      { userId, widgetType: 'deadline_alerts', title: 'Alertas de Prazo', position: 3, width: 1, height: 1, visible: true },
      { userId, widgetType: 'recent_processes', title: 'Processos Recentes', position: 4, width: 2, height: 1, visible: true },
      { userId, widgetType: 'activity_feed', title: 'Atividade Recente', position: 5, width: 2, height: 1, visible: true },
    ];

    const widgets: DashboardWidget[] = [];
    for (const widget of defaultWidgets) {
      const created = await this.createDashboardWidget(widget);
      widgets.push(created);
    }
    return widgets;
  }

  // Unit methods
  async getAllUnits(): Promise<Unit[]> {
    return await db.select().from(schema.units).orderBy(schema.units.nomeFantasia);
  }

  async getUnit(id: number): Promise<Unit | undefined> {
    const result = await db.select().from(schema.units).where(eq(schema.units.id, id)).limit(1);
    return result[0];
  }

  async getUnitByCnpj(cnpj: string): Promise<Unit | undefined> {
    const result = await db.select().from(schema.units).where(eq(schema.units.cnpj, cnpj)).limit(1);
    return result[0];
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    const result = await db.insert(schema.units).values(unit).returning();
    return result[0];
  }

  async updateUnit(id: number, updates: UpdateUnit): Promise<Unit | undefined> {
    const result = await db.update(schema.units).set(updates).where(eq(schema.units.id, id)).returning();
    return result[0];
  }

  async deleteUnit(id: number): Promise<boolean> {
    const result = await db.delete(schema.units).where(eq(schema.units.id, id)).returning();
    return result.length > 0;
  }

  // Process Type methods
  async getAllProcessTypes(): Promise<ProcessType[]> {
    return await db.select().from(schema.processTypes).orderBy(schema.processTypes.order);
  }

  async getProcessType(id: number): Promise<ProcessType | undefined> {
    const result = await db.select().from(schema.processTypes).where(eq(schema.processTypes.id, id)).limit(1);
    return result[0];
  }

  async createProcessType(type: InsertProcessType): Promise<ProcessType> {
    const result = await db.insert(schema.processTypes).values(type).returning();
    return result[0];
  }

  async updateProcessType(id: number, updates: UpdateProcessType): Promise<ProcessType | undefined> {
    const result = await db.update(schema.processTypes).set(updates).where(eq(schema.processTypes.id, id)).returning();
    return result[0];
  }

  async deleteProcessType(id: number): Promise<boolean> {
    const result = await db.delete(schema.processTypes).where(eq(schema.processTypes.id, id)).returning();
    return result.length > 0;
  }

  // Priority methods
  async getAllPriorities(): Promise<Priority[]> {
    return await db.select().from(schema.priorities).orderBy(schema.priorities.order);
  }

  async getPriority(id: number): Promise<Priority | undefined> {
    const result = await db.select().from(schema.priorities).where(eq(schema.priorities.id, id)).limit(1);
    return result[0];
  }

  async createPriority(priority: InsertPriority): Promise<Priority> {
    const result = await db.insert(schema.priorities).values(priority).returning();
    return result[0];
  }

  async updatePriority(id: number, updates: UpdatePriority): Promise<Priority | undefined> {
    const result = await db.update(schema.priorities).set(updates).where(eq(schema.priorities.id, id)).returning();
    return result[0];
  }

  async deletePriority(id: number): Promise<boolean> {
    const result = await db.delete(schema.priorities).where(eq(schema.priorities.id, id)).returning();
    return result.length > 0;
  }

  // Initialize database with default admin user if empty
  async initializeDefaultData(): Promise<void> {
    try {
      // Check if any profiles exist
      const existingProfiles = await this.getAllProfiles();

      if (existingProfiles.length === 0) {
        console.log('[init] No users found in database, creating default admin...');

        // Import hashPassword dynamically to avoid circular dependencies
        const { hashPassword } = await import('./password');
        const hashedPassword = await hashPassword('admin123');

        // Create default admin user
        await this.createProfile({
          name: 'Administrador',
          email: 'admin@mediflow.com',
          password: hashedPassword,
          role: 'admin',
          unit: 'Administração Central',
          status: 'active',
        });

        console.log('[init] Default admin created: admin@mediflow.com / admin123');
      }

      // Check if default priorities exist
      const existingPriorities = await this.getAllPriorities();
      if (existingPriorities.length === 0) {
        console.log('[init] Creating default priorities...');
        await this.createPriority({ name: 'Baixa', color: '#22c55e', order: 1 });
        await this.createPriority({ name: 'Média', color: '#eab308', order: 2 });
        await this.createPriority({ name: 'Alta', color: '#f97316', order: 3 });
        await this.createPriority({ name: 'Crítica', color: '#ef4444', order: 4 });
        console.log('[init] Default priorities created');
      }

      // Check if default process types exist
      const existingTypes = await this.getAllProcessTypes();
      if (existingTypes.length === 0) {
        console.log('[init] Creating default process types...');
        await this.createProcessType({ name: 'Administrativo', description: 'Processos administrativos gerais', color: '#3b82f6' });
        await this.createProcessType({ name: 'Compras', description: 'Processos de compras e aquisições', color: '#22c55e' });
        await this.createProcessType({ name: 'Jurídico', description: 'Processos jurídicos e legais', color: '#8b5cf6' });
        await this.createProcessType({ name: 'Financeiro', description: 'Processos financeiros', color: '#f59e0b' });
        console.log('[init] Default process types created');
      }

      // Initialize default branding if not exists
      try {
        const branding = await this.getBrandingConfig();
        if (!branding || !branding.appName) {
          console.log('[init] Setting up default branding...');
        }
      } catch (e) {
        // Branding will be created by getBrandingConfig if not exists
      }

      // Initialize default alert settings if not exists
      try {
        await this.getAlertSettings();
      } catch (e) {
        // Alert settings will be created if not exists
      }

    } catch (error) {
      console.error('[init] Error initializing default data:', error);
    }
  }
}

export const storage = new DatabaseStorage();
