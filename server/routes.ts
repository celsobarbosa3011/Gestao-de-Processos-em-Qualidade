import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProfileSchema, 
  insertProcessSchema, 
  updateProcessSchema,
  insertProcessCommentSchema,
  insertProcessEventSchema,
  updateAlertSettingsSchema,
  updateBrandingConfigSchema 
} from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== AUTH ROUTES =====
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const profile = await storage.getProfileByEmail(email);
      
      if (!profile) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // In production, use bcrypt to compare hashed passwords
      if (profile.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Don't send password back
      const { password: _, ...profileWithoutPassword } = profile;
      res.json(profileWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== PROFILE/USER ROUTES =====
  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      const profilesWithoutPasswords = profiles.map(({ password, ...profile }) => profile);
      res.json(profilesWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const validatedData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validatedData);
      const { password: _, ...profileWithoutPassword } = profile;
      res.status(201).json(profileWithoutPassword);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const profile = await storage.updateProfile(id, updates);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const { password: _, ...profileWithoutPassword } = profile;
      res.json(profileWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ===== PROCESS ROUTES =====
  app.get("/api/processes", async (req, res) => {
    try {
      const processes = await storage.getAllProcesses();
      res.json(processes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processes" });
    }
  });

  app.get("/api/processes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const process = await storage.getProcess(id);
      
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }
      
      res.json(process);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process" });
    }
  });

  app.post("/api/processes", async (req, res) => {
    try {
      const validatedData = insertProcessSchema.parse(req.body);
      const process = await storage.createProcess(validatedData);
      
      // Create initial event
      await storage.createEvent({
        processId: process.id,
        userId: validatedData.responsibleId || 'system',
        action: 'created',
        details: 'Processo criado'
      });
      
      res.status(201).json(process);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create process" });
    }
  });

  app.patch("/api/processes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateProcessSchema.parse(req.body);
      const process = await storage.updateProcess(id, validatedData);
      
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }
      
      // Log status change if status was updated
      if (validatedData.status) {
        await storage.createEvent({
          processId: id,
          userId: req.body.userId || 'system',
          action: 'status_changed',
          details: `Status alterado para ${validatedData.status}`
        });
      }
      
      res.json(process);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update process" });
    }
  });

  // ===== COMMENT ROUTES =====
  app.get("/api/processes/:id/comments", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const comments = await storage.getCommentsByProcess(processId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/processes/:id/comments", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const validatedData = insertProcessCommentSchema.parse({
        ...req.body,
        processId
      });
      const comment = await storage.createComment(validatedData);
      
      // Log comment event
      await storage.createEvent({
        processId,
        userId: validatedData.userId,
        action: 'comment_added',
        details: 'Novo comentário adicionado'
      });
      
      res.status(201).json(comment);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // ===== EVENT/HISTORY ROUTES =====
  app.get("/api/processes/:id/events", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const events = await storage.getEventsByProcess(processId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // ===== ALERT SETTINGS ROUTES =====
  app.get("/api/settings/alerts", async (req, res) => {
    try {
      const settings = await storage.getAlertSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert settings" });
    }
  });

  app.patch("/api/settings/alerts", async (req, res) => {
    try {
      const validatedData = updateAlertSettingsSchema.parse(req.body);
      const settings = await storage.updateAlertSettings(validatedData);
      res.json(settings);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update alert settings" });
    }
  });

  // ===== BRANDING CONFIG ROUTES =====
  app.get("/api/settings/branding", async (req, res) => {
    try {
      const config = await storage.getBrandingConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch branding config" });
    }
  });

  app.patch("/api/settings/branding", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const user = await storage.getProfile(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required to modify branding" });
      }
      
      const { userId: _, ...brandingData } = req.body;
      const validatedData = updateBrandingConfigSchema.parse(brandingData);
      const config = await storage.updateBrandingConfig(validatedData);
      res.json(config);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update branding config" });
    }
  });

  return httpServer;
}
