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
}

export const storage = new DatabaseStorage();
