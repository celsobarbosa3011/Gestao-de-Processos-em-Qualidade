import { drizzle } from "drizzle-orm/node-postgres";
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
} from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });

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
  deleteTemplate(id: number): Promise<boolean>;
  
  // Feature Toggle methods
  getAllFeatureToggles(): Promise<FeatureToggle[]>;
  updateFeatureToggle(featureKey: string, enabled: boolean): Promise<FeatureToggle>;
}

export class DatabaseStorage implements IStorage {
  // Profile methods
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(schema.profiles).where(eq(schema.profiles.email, email)).limit(1);
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
    const result = await db.insert(schema.processes).values(process).returning();
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
}

export const storage = new DatabaseStorage();
