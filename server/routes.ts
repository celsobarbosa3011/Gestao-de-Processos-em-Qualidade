import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProfileSchema,
  adminUpdateProfileSchema,
  insertProcessSchema, 
  updateProcessSchema,
  insertProcessCommentSchema,
  insertProcessEventSchema,
  updateAlertSettingsSchema,
  updateBrandingConfigSchema 
} from "@shared/schema";
import { fromError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "client/public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== UPLOAD ROUTES =====
  app.post("/api/upload", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao fazer upload" });
    }
  });

  // ===== AUTH ROUTES =====
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const profile = await storage.getProfileByEmail(email);
      
      if (!profile) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      let isValidPassword = false;
      let usedProvisionalPassword = false;
      
      // Check regular password first
      if (profile.password === password) {
        isValidPassword = true;
      }
      
      // Check provisional password if regular failed
      if (!isValidPassword && profile.provisionalPassword) {
        const now = new Date();
        const expiresAt = profile.provisionalPasswordExpiresAt;
        
        if (profile.provisionalPassword === password) {
          if (expiresAt && now > expiresAt) {
            return res.status(401).json({ error: "Senha provisória expirada. Contate o administrador." });
          }
          isValidPassword = true;
          usedProvisionalPassword = true;
        }
      }
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Don't send password back
      const { password: _, provisionalPassword: __, ...profileWithoutPassword } = profile;
      res.json({
        ...profileWithoutPassword,
        mustChangePassword: profile.mustChangePassword || usedProvisionalPassword
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Change password endpoint (requires current password or valid provisional password)
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      
      if (!userId || !newPassword || !currentPassword) {
        return res.status(400).json({ error: "ID do usuário, senha atual e nova senha são obrigatórios" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "A nova senha deve ter pelo menos 8 caracteres" });
      }
      
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Must validate current password or provisional password
      let isValidCredential = false;
      
      // Check regular password
      if (profile.password === currentPassword) {
        isValidCredential = true;
      }
      
      // Check provisional password (must not be expired)
      if (!isValidCredential && profile.provisionalPassword === currentPassword) {
        const now = new Date();
        const expiresAt = profile.provisionalPasswordExpiresAt;
        if (expiresAt && now <= expiresAt) {
          isValidCredential = true;
        } else if (expiresAt && now > expiresAt) {
          return res.status(401).json({ error: "Senha provisória expirada. Contate o administrador." });
        }
      }
      
      if (!isValidCredential) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }
      
      // Update password and clear provisional password fields
      const updatedProfile = await storage.updateProfile(userId, {
        password: newPassword,
        provisionalPassword: null,
        provisionalPasswordExpiresAt: null,
        mustChangePassword: false,
      } as any);
      
      if (!updatedProfile) {
        return res.status(500).json({ error: "Falha ao atualizar senha" });
      }
      
      const { password: _, provisionalPassword: __, provisionalPasswordExpiresAt: ___, ...sanitizedProfile } = updatedProfile;
      res.json(sanitizedProfile);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate provisional password for user (admin only - requires adminUserId in body)
  app.post("/api/profiles/:id/provisional-password", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminUserId } = req.body;
      
      // Verify admin authorization
      if (!adminUserId) {
        return res.status(401).json({ error: "Autorização necessária" });
      }
      
      const adminProfile = await storage.getProfile(adminUserId);
      if (!adminProfile || adminProfile.role !== 'admin') {
        return res.status(403).json({ error: "Apenas administradores podem gerar senhas provisórias" });
      }
      
      const profile = await storage.getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Generate random provisional password
      const provisionalPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const updatedProfile = await storage.updateProfile(id, {
        provisionalPassword,
        provisionalPasswordExpiresAt: expiresAt,
        mustChangePassword: true,
      } as any);
      
      if (!updatedProfile) {
        return res.status(500).json({ error: "Failed to generate provisional password" });
      }
      
      // Return the provisional password to the admin (one-time display)
      res.json({ 
        provisionalPassword,
        expiresAt,
        message: "Senha provisória gerada. O usuário deve trocá-la em até 24 horas."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate provisional password" });
    }
  });

  // ===== PROFILE/USER ROUTES =====
  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      const sanitizedProfiles = profiles.map(({ password, provisionalPassword, provisionalPasswordExpiresAt, ...profile }) => profile);
      res.json(sanitizedProfiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const validatedData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(validatedData);
      const { password: _, provisionalPassword: __, provisionalPasswordExpiresAt: ___, ...sanitizedProfile } = profile;
      res.status(201).json(sanitizedProfile);
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
      const validatedData = adminUpdateProfileSchema.parse(req.body);
      const profile = await storage.updateProfile(id, validatedData);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const { password: _, provisionalPassword: __, provisionalPasswordExpiresAt: ___, ...sanitizedProfile } = profile;
      res.json(sanitizedProfile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProfile(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete profile" });
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
