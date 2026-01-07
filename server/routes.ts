import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProfileSchema,
  insertProfileSchemaForApi,
  adminUpdateProfileSchema,
  insertProcessSchema, 
  updateProcessSchema,
  insertProcessCommentSchema,
  insertProcessEventSchema,
  updateAlertSettingsSchema,
  updateBrandingConfigSchema,
  updateWipLimitSchema,
  insertProcessChecklistSchema,
  insertProcessAttachmentSchema,
  insertProcessLabelSchema,
  insertChatMessageSchema,
  insertTimeEntrySchema,
  insertCustomFieldSchema,
  insertAutomationSchema,
  insertNotificationSchema,
  insertSwimlaneSchema,
  insertDashboardWidgetSchema,
  insertUnitSchema,
  updateUnitSchema
} from "@shared/schema";
import { fromError } from "zod-validation-error";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateToken, authMiddleware, adminMiddleware } from "./auth";
import { hashPassword, verifyPassword, isHashed } from "./password";
import { stripHtml } from "./sanitize";
import { wsManager } from "./websocket";
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";
import { sendProvisionalPasswordEmail } from "./email";

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
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      // Audio
      'audio/mpeg',
      'audio/wav',
      // Video
      'video/mp4',
      'video/x-msvideo',
      // Archives
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, true); // Allow all types but keep the size limit
    }
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register Object Storage routes for persistent file storage
  registerObjectStorageRoutes(app);
  const objectStorageService = new ObjectStorageService();
  
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
      // Sanitize inputs - remove extra spaces (common on mobile devices)
      const email = (req.body.email || '').trim().toLowerCase();
      const password = (req.body.password || '').toString().trim();
      
      console.log(`[auth] Login attempt for email: "${email}" (length: ${email.length})`);
      
      const profile = await storage.getProfileByEmail(email);
      
      if (!profile) {
        console.log(`[auth] No profile found for email: "${email}"`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      let isValidPassword = false;
      let usedProvisionalPassword = false;
      
      // Check regular password first (supports both hashed and plaintext for migration)
      if (profile.password) {
        if (isHashed(profile.password)) {
          isValidPassword = await verifyPassword(password, profile.password);
        } else {
          isValidPassword = profile.password === password;
          // Migrate to hashed password on successful login
          if (isValidPassword) {
            const hashedPassword = await hashPassword(password);
            await storage.updateProfile(profile.id, { password: hashedPassword } as any);
          }
        }
      }
      
      // Check provisional password if regular failed
      if (!isValidPassword && profile.provisionalPassword) {
        const now = new Date();
        const expiresAt = profile.provisionalPasswordExpiresAt;
        
        if (isHashed(profile.provisionalPassword)) {
          isValidPassword = await verifyPassword(password, profile.provisionalPassword);
        } else {
          isValidPassword = profile.provisionalPassword === password;
        }
        
        if (isValidPassword) {
          if (expiresAt && now > expiresAt) {
            return res.status(401).json({ error: "Senha provisória expirada. Contate o administrador." });
          }
          usedProvisionalPassword = true;
        }
      }
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const mustChange = profile.mustChangePassword || usedProvisionalPassword;
      
      // Generate JWT token
      const token = generateToken({
        userId: profile.id,
        email: profile.email,
        role: profile.role,
        mustChangePassword: mustChange,
      });
      
      // Don't send password back
      const { password: _, provisionalPassword: __, ...profileWithoutPassword } = profile;
      res.json({
        ...profileWithoutPassword,
        mustChangePassword: mustChange,
        token,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Self-registration endpoint (public - for new users to create their own account)
  // SECURITY: Only accepts name, email, password, confirmPassword - all other fields are set securely by the server
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Only extract allowed fields - ignore any attempt to set role, status, etc.
      const { name, email, password, confirmPassword } = req.body;
      
      // Validate using Zod schema for security
      const registerSchema = z.object({
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(1, "Confirmação de senha obrigatória"),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
      });
      
      const validation = registerSchema.safeParse({ name, email, password, confirmPassword });
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ error: validationError.toString() });
      }
      
      const validatedData = validation.data;
      const sanitizedEmail = validatedData.email.trim().toLowerCase();
      
      // Check if email already exists
      const existingProfile = await storage.getProfileByEmail(sanitizedEmail);
      if (existingProfile) {
        return res.status(409).json({ error: "Este email já está cadastrado" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create profile with SECURE defaults - never trust client input for sensitive fields
      const newProfile = await storage.createProfile({
        name: validatedData.name.trim(),
        email: sanitizedEmail,
        password: hashedPassword,
        role: 'user', // SECURITY: Always set to 'user' - never allow client to set this
        unit: 'pendente', // Will be set when completing profile
        status: 'active', // SECURITY: Always set to 'active' - never allow client to set this
        profileCompleted: false, // Must complete profile
        mustChangePassword: false, // User created their own password
      });
      
      // Generate JWT token for auto-login
      const token = generateToken({
        userId: newProfile.id,
        email: newProfile.email,
        role: newProfile.role,
        mustChangePassword: false,
      });
      
      // Don't send password back
      const { password: _, provisionalPassword: __, ...profileWithoutPassword } = newProfile;
      res.status(201).json({
        ...profileWithoutPassword,
        token,
      });
    } catch (error: any) {
      console.error('[auth] Registration error:', error);
      res.status(500).json({ error: "Erro ao criar conta. Tente novamente." });
    }
  });

  // Change password endpoint (authenticated - uses JWT to identify user)
  app.post("/api/auth/change-password", authMiddleware, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.auth!.userId;
      
      if (!newPassword || !currentPassword) {
        return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
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
      
      // Check regular password (supports both hashed and plaintext)
      if (profile.password) {
        if (isHashed(profile.password)) {
          isValidCredential = await verifyPassword(currentPassword, profile.password);
        } else {
          isValidCredential = profile.password === currentPassword;
        }
      }
      
      // Check provisional password (must not be expired)
      if (!isValidCredential && profile.provisionalPassword) {
        let provisionalMatch = false;
        if (isHashed(profile.provisionalPassword)) {
          provisionalMatch = await verifyPassword(currentPassword, profile.provisionalPassword);
        } else {
          provisionalMatch = profile.provisionalPassword === currentPassword;
        }
        
        if (provisionalMatch) {
          const now = new Date();
          const expiresAt = profile.provisionalPasswordExpiresAt;
          if (expiresAt && now <= expiresAt) {
            isValidCredential = true;
          } else if (expiresAt && now > expiresAt) {
            return res.status(401).json({ error: "Senha provisória expirada. Contate o administrador." });
          }
        }
      }
      
      if (!isValidCredential) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password and clear provisional password fields
      const updatedProfile = await storage.updateProfile(userId, {
        password: hashedPassword,
        provisionalPassword: null,
        provisionalPasswordExpiresAt: null,
        mustChangePassword: false,
      } as any);
      
      if (!updatedProfile) {
        return res.status(500).json({ error: "Falha ao atualizar senha" });
      }
      
      // Generate new token with updated mustChangePassword flag
      const newToken = generateToken({
        userId: updatedProfile.id,
        email: updatedProfile.email,
        role: updatedProfile.role,
        mustChangePassword: false,
      });
      
      const { password: _, provisionalPassword: __, provisionalPasswordExpiresAt: ___, ...sanitizedProfile } = updatedProfile;
      res.json({ ...sanitizedProfile, token: newToken });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate provisional password for user (admin only - JWT authenticated)
  app.post("/api/profiles/:id/provisional-password", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      
      const profile = await storage.getProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Generate random provisional password
      const provisionalPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Hash the provisional password before storing
      const hashedProvisionalPassword = await hashPassword(provisionalPassword);
      
      const updatedProfile = await storage.updateProfile(id, {
        provisionalPassword: hashedProvisionalPassword,
        provisionalPasswordExpiresAt: expiresAt,
        mustChangePassword: true,
      } as any);
      
      if (!updatedProfile) {
        return res.status(500).json({ error: "Failed to generate provisional password" });
      }
      
      // Send email with provisional password
      const emailSent = await sendProvisionalPasswordEmail(
        profile.email,
        profile.name,
        provisionalPassword,
        expiresAt
      );
      
      // Return the plaintext provisional password to the admin (one-time display only)
      res.json({ 
        provisionalPassword,
        expiresAt,
        emailSent,
        message: emailSent 
          ? "Senha provisória gerada e enviada por email. O usuário deve trocá-la em até 24 horas."
          : "Senha provisória gerada. O email não pôde ser enviado, informe a senha manualmente."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate provisional password" });
    }
  });

  // ===== PROFILE/USER ROUTES =====
  app.get("/api/profiles", authMiddleware, async (req, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      const sanitizedProfiles = profiles.map(({ password, provisionalPassword, provisionalPasswordExpiresAt, ...profile }) => profile);
      res.json(sanitizedProfiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertProfileSchemaForApi.parse(req.body);
      
      // Generate provisional password for new users
      const provisionalPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const hashedProvisionalPassword = await hashPassword(provisionalPassword);
      
      // Use the provisional password as both the main password and provisional password
      // User must use the provisional password to login initially
      const profile = await storage.createProfile({
        ...validatedData,
        password: hashedProvisionalPassword, // Use same hash for initial login
        provisionalPassword: hashedProvisionalPassword,
        provisionalPasswordExpiresAt: expiresAt,
        mustChangePassword: true,
        profileCompleted: false,
      } as any);
      
      // Send email with provisional password
      const emailSent = await sendProvisionalPasswordEmail(
        profile.email,
        profile.name,
        provisionalPassword,
        expiresAt
      );
      
      const { password: _, provisionalPassword: __, provisionalPasswordExpiresAt: ___, ...sanitizedProfile } = profile;
      res.status(201).json({ ...sanitizedProfile, emailSent });
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

  // ===== UNIT ROUTES =====
  app.get("/api/units", authMiddleware, async (req, res) => {
    try {
      const units = await storage.getAllUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch units" });
    }
  });

  app.get("/api/units/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const unit = await storage.getUnit(id);
      
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      
      res.json(unit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unit" });
    }
  });

  app.post("/api/units", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(validatedData);
      res.status(201).json(unit);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      if (error.code === '23505') {
        return res.status(400).json({ error: "CNPJ já cadastrado" });
      }
      res.status(500).json({ error: "Failed to create unit" });
    }
  });

  app.patch("/api/units/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateUnitSchema.parse(req.body);
      const unit = await storage.updateUnit(id, validatedData);
      
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      
      res.json(unit);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update unit" });
    }
  });

  app.delete("/api/units/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUnit(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Unit not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete unit" });
    }
  });

  // ===== PROCESS TYPES ROUTES =====
  app.get("/api/process-types", authMiddleware, async (req, res) => {
    try {
      const types = await storage.getAllProcessTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process types" });
    }
  });

  app.post("/api/process-types", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { insertProcessTypeSchema } = await import("@shared/schema");
      const validatedData = insertProcessTypeSchema.parse(req.body);
      const type = await storage.createProcessType(validatedData);
      res.status(201).json(type);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      if (error.code === '23505') {
        return res.status(400).json({ error: "Tipo de processo já existe" });
      }
      res.status(500).json({ error: "Failed to create process type" });
    }
  });

  app.patch("/api/process-types/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { updateProcessTypeSchema } = await import("@shared/schema");
      const validatedData = updateProcessTypeSchema.parse(req.body);
      const type = await storage.updateProcessType(id, validatedData);
      
      if (!type) {
        return res.status(404).json({ error: "Process type not found" });
      }
      
      res.json(type);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update process type" });
    }
  });

  app.delete("/api/process-types/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProcessType(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Process type not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete process type" });
    }
  });

  // ===== PRIORITIES ROUTES =====
  app.get("/api/priorities", authMiddleware, async (req, res) => {
    try {
      const priorities = await storage.getAllPriorities();
      res.json(priorities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch priorities" });
    }
  });

  app.post("/api/priorities", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { insertPrioritySchema } = await import("@shared/schema");
      const validatedData = insertPrioritySchema.parse(req.body);
      const priority = await storage.createPriority(validatedData);
      res.status(201).json(priority);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      if (error.code === '23505') {
        return res.status(400).json({ error: "Prioridade já existe" });
      }
      res.status(500).json({ error: "Failed to create priority" });
    }
  });

  app.patch("/api/priorities/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { updatePrioritySchema } = await import("@shared/schema");
      const validatedData = updatePrioritySchema.parse(req.body);
      const priority = await storage.updatePriority(id, validatedData);
      
      if (!priority) {
        return res.status(404).json({ error: "Priority not found" });
      }
      
      res.json(priority);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update priority" });
    }
  });

  app.delete("/api/priorities/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePriority(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Priority not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete priority" });
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
      const data = { ...req.body };
      if (data.deadline && typeof data.deadline === 'string') {
        data.deadline = new Date(data.deadline);
      }
      const validatedData = insertProcessSchema.parse(data);
      const process = await storage.createProcess(validatedData);
      
      // Create initial event
      await storage.createEvent({
        processId: process.id,
        userId: validatedData.responsibleId || 'system',
        action: 'created',
        details: 'Processo criado'
      });
      
      wsManager.broadcast({ type: 'process_created', payload: process });
      
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
      
      wsManager.broadcast({ type: 'process_updated', payload: process });
      
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

  // ===== WIP LIMITS ROUTES =====
  app.get("/api/settings/wip-limits", async (req, res) => {
    try {
      const limits = await storage.getAllWipLimits();
      res.json(limits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch WIP limits" });
    }
  });

  app.patch("/api/settings/wip-limits/:columnId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { columnId } = req.params;
      const validatedData = updateWipLimitSchema.parse(req.body);
      const limit = await storage.upsertWipLimit(columnId, validatedData);
      res.json(limit);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update WIP limit" });
    }
  });

  // ===== CHECKLIST ROUTES =====
  app.get("/api/processes/:processId/checklists", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const checklists = await storage.getChecklistsByProcess(processId);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch checklists" });
    }
  });

  app.post("/api/processes/:processId/checklists", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }
      const checklist = await storage.createChecklist({ processId, text, completed: false });
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: "Failed to create checklist item" });
    }
  });

  app.patch("/api/checklists/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { completed } = req.body;
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: "Completed must be a boolean" });
      }
      const checklist = await storage.updateChecklist(id, completed);
      if (!checklist) {
        return res.status(404).json({ error: "Checklist item not found" });
      }
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: "Failed to update checklist item" });
    }
  });

  app.delete("/api/checklists/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteChecklist(id);
      if (!deleted) {
        return res.status(404).json({ error: "Checklist item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete checklist item" });
    }
  });

  // ===== ATTACHMENT ROUTES =====
  app.get("/api/processes/:processId/attachments", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check process access authorization
      if (!await canAccessProcess(userId, processId)) {
        return res.status(403).json({ error: "Access denied to this process" });
      }

      const attachments = await storage.getAttachmentsByProcess(processId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  // Helper function to check if user can access a process
  async function canAccessProcess(userId: string, processId: number): Promise<boolean> {
    const user = await storage.getProfile(userId);
    if (!user) return false;
    
    // Admin can access all processes
    if (user.role === 'admin') return true;
    
    const process = await storage.getProcess(processId);
    if (!process) return false;
    
    // User can access if they belong to the same unit or are responsible
    return process.unit === user.unit || process.responsibleId === userId;
  }

  // Request presigned URL for attachment upload (Object Storage)
  app.post("/api/processes/:processId/attachments/request-url", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check process access authorization
      if (!await canAccessProcess(userId, processId)) {
        return res.status(403).json({ error: "Access denied to this process" });
      }

      const { name, size, contentType } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Save attachment metadata after successful upload to Object Storage
  app.post("/api/processes/:processId/attachments/save", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check process access authorization
      if (!await canAccessProcess(userId, processId)) {
        return res.status(403).json({ error: "Access denied to this process" });
      }

      const { objectPath, fileName, fileType, fileSize } = req.body;
      
      if (!objectPath || !fileName) {
        return res.status(400).json({ error: "Missing required fields: objectPath, fileName" });
      }

      // Validate that file exists in Object Storage before saving metadata
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        
        // Set private ACL policy - files are accessed only via authenticated endpoint
        await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
          owner: userId,
          visibility: "private",
        });
      } catch (fileError) {
        console.error("File not found in Object Storage:", fileError);
        return res.status(400).json({ error: "File upload not confirmed. Please try again." });
      }

      const attachment = await storage.createAttachment({
        processId,
        userId,
        fileName,
        fileUrl: objectPath,
        fileType: fileType || "application/octet-stream",
        fileSize: fileSize || 0,
      });
      res.json(attachment);
    } catch (error) {
      console.error("Error saving attachment:", error);
      res.status(500).json({ error: "Failed to save attachment" });
    }
  });

  // Authenticated download endpoint for attachments stored in Object Storage
  app.get("/api/attachments/:id/download", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const attachment = await storage.getAttachment(id);
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      // Check process access authorization
      if (!await canAccessProcess(userId, attachment.processId)) {
        return res.status(403).json({ error: "Access denied to this attachment" });
      }

      // Handle Object Storage files
      if (attachment.fileUrl.startsWith("/objects/")) {
        try {
          const objectFile = await objectStorageService.getObjectEntityFile(attachment.fileUrl);
          
          // Set content disposition for download
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);
          
          await objectStorageService.downloadObject(objectFile, res);
        } catch (error) {
          console.error("Error downloading from Object Storage:", error);
          return res.status(404).json({ error: "File not found in storage" });
        }
      } else if (attachment.fileUrl.startsWith("/uploads/")) {
        // Legacy local file - check if file exists
        // Files are stored in client/public/uploads with filename only
        const fileName = attachment.fileUrl.replace("/uploads/", "");
        const filePath = path.join(uploadDir, fileName);
        
        if (fs.existsSync(filePath)) {
          // File exists locally, stream it
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        } else {
          // Legacy file was lost (common in production deployments)
          return res.status(410).json({ 
            error: "Este arquivo foi enviado antes da migração para armazenamento permanente e não está mais disponível. Por favor, faça upload do arquivo novamente.",
            code: "LEGACY_FILE_UNAVAILABLE"
          });
        }
      } else {
        return res.status(400).json({ error: "Invalid file URL format" });
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      res.status(500).json({ error: "Failed to download attachment" });
    }
  });

  // Legacy upload route (fallback for local storage - kept for compatibility)
  app.post("/api/processes/:processId/attachments", authMiddleware, upload.single('file'), async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const userId = req.auth?.userId;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check process access authorization
      if (!await canAccessProcess(userId, processId)) {
        return res.status(403).json({ error: "Access denied to this process" });
      }
      
      const attachment = await storage.createAttachment({
        processId,
        userId,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });
      res.json(attachment);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload attachment" });
    }
  });

  app.delete("/api/attachments/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const attachment = await storage.getAttachment(id);
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      // Check process access authorization
      if (!await canAccessProcess(userId, attachment.processId)) {
        return res.status(403).json({ error: "Access denied to delete this attachment" });
      }

      const deleted = await storage.deleteAttachment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // ===== LABEL ROUTES =====
  app.get("/api/labels", authMiddleware, async (req, res) => {
    try {
      const labels = await storage.getAllLabels();
      res.json(labels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch labels" });
    }
  });

  app.post("/api/labels", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertProcessLabelSchema.parse(req.body);
      const label = await storage.createLabel(validatedData);
      res.json(label);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create label" });
    }
  });

  app.delete("/api/labels/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLabel(id);
      if (!deleted) {
        return res.status(404).json({ error: "Label not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete label" });
    }
  });

  app.get("/api/processes/:processId/labels", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const labels = await storage.getLabelsByProcess(processId);
      res.json(labels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process labels" });
    }
  });

  app.post("/api/processes/:processId/labels/:labelId", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const labelId = parseInt(req.params.labelId);
      const junction = await storage.addLabelToProcess(processId, labelId);
      res.json(junction);
    } catch (error) {
      res.status(500).json({ error: "Failed to add label to process" });
    }
  });

  app.delete("/api/processes/:processId/labels/:labelId", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.processId);
      const labelId = parseInt(req.params.labelId);
      const deleted = await storage.removeLabelFromProcess(processId, labelId);
      if (!deleted) {
        return res.status(404).json({ error: "Label not found on process" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove label from process" });
    }
  });

  // ===== CHAT ROUTES =====
  app.get("/api/chat/messages", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/chat/conversations", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/chat/conversation/:userId", authMiddleware, async (req, res) => {
    try {
      const currentUserId = req.auth!.userId;
      const otherUserId = req.params.userId;
      const messages = await storage.getChatConversation(currentUserId, otherUserId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(otherUserId, currentUserId);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/chat/messages", authMiddleware, async (req, res) => {
    try {
      const senderId = req.auth!.userId;
      
      // Validate message payload
      const result = insertChatMessageSchema.pick({ 
        receiverId: true, 
        message: true 
      }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: fromError(result.error).message });
      }
      
      const { receiverId, message } = result.data;
      
      // Sanitize message - strip HTML and limit length for XSS prevention
      const sanitizedMessage = stripHtml(message).slice(0, 2000);
      
      if (!sanitizedMessage) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      
      const chatMessage = await storage.sendChatMessage({
        senderId,
        receiverId: receiverId || null,
        message: sanitizedMessage,
        isRead: false,
      });
      
      res.json(chatMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/chat/unread", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      const count = await storage.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // ===== PERMISSION ROUTES =====
  app.get("/api/permissions", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.get("/api/permissions/role/:role", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const role = req.params.role;
      const permissions = await storage.getRolePermissions(role);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  app.post("/api/permissions/role/:role", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const role = req.params.role;
      const { permissionKey } = req.body;
      const rolePermission = await storage.setRolePermission(role, permissionKey);
      res.json(rolePermission);
    } catch (error) {
      res.status(500).json({ error: "Failed to set role permission" });
    }
  });

  app.delete("/api/permissions/role/:role/:permissionKey", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { role, permissionKey } = req.params;
      const deleted = await storage.removeRolePermission(role, permissionKey);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove role permission" });
    }
  });

  app.get("/api/permissions/user/:userId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  app.post("/api/permissions/user/:userId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;
      const { permissionKey, granted } = req.body;
      const userPermission = await storage.setUserPermission(userId, permissionKey, granted);
      res.json(userPermission);
    } catch (error) {
      res.status(500).json({ error: "Failed to set user permission" });
    }
  });

  // ===== TEMPLATE ROUTES =====
  app.get("/api/templates", authMiddleware, async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const createdBy = req.auth!.userId;
      const template = await storage.createTemplate({
        ...req.body,
        createdBy,
      });
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.patch("/api/templates/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.updateTemplate(id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTemplate(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // ===== FEATURE TOGGLES ROUTES =====
  app.get("/api/features", authMiddleware, async (req, res) => {
    try {
      const features = await storage.getAllFeatureToggles();
      res.json(features);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  app.patch("/api/features/:featureKey", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { featureKey } = req.params;
      const { enabled } = req.body;
      const feature = await storage.updateFeatureToggle(featureKey, enabled);
      res.json(feature);
    } catch (error) {
      res.status(500).json({ error: "Failed to update feature" });
    }
  });

  // ===== TIME ENTRY ROUTES =====
  app.get("/api/processes/:id/time-entries", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const entries = await storage.getTimeEntriesByProcess(processId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.post("/api/processes/:id/time-entries", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const userId = req.auth!.userId;
      const validatedData = insertTimeEntrySchema.parse({
        ...req.body,
        processId,
        userId
      });
      const entry = await storage.createTimeEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create time entry" });
    }
  });

  app.delete("/api/time-entries/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTimeEntry(id);
      if (!deleted) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time entry" });
    }
  });

  app.get("/api/processes/:id/total-time", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const totalMinutes = await storage.getTotalTimeByProcess(processId);
      res.json({ totalMinutes });
    } catch (error) {
      res.status(500).json({ error: "Failed to get total time" });
    }
  });

  // ===== CUSTOM FIELD ROUTES =====
  app.get("/api/custom-fields", authMiddleware, async (req, res) => {
    try {
      const fields = await storage.getAllCustomFields();
      res.json(fields);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custom fields" });
    }
  });

  app.post("/api/custom-fields", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertCustomFieldSchema.parse(req.body);
      const field = await storage.createCustomField(validatedData);
      res.status(201).json(field);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create custom field" });
    }
  });

  app.patch("/api/custom-fields/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const field = await storage.updateCustomField(id, req.body);
      if (!field) {
        return res.status(404).json({ error: "Custom field not found" });
      }
      res.json(field);
    } catch (error) {
      res.status(500).json({ error: "Failed to update custom field" });
    }
  });

  app.delete("/api/custom-fields/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCustomField(id);
      if (!deleted) {
        return res.status(404).json({ error: "Custom field not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete custom field" });
    }
  });

  app.get("/api/processes/:id/custom-field-values", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const values = await storage.getCustomFieldValues(processId);
      res.json(values);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custom field values" });
    }
  });

  app.post("/api/processes/:id/custom-field-values", authMiddleware, async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const { fieldId, value } = req.body;
      if (typeof fieldId !== 'number') {
        return res.status(400).json({ error: "fieldId is required and must be a number" });
      }
      const fieldValue = await storage.setCustomFieldValue(processId, fieldId, value ?? null);
      res.json(fieldValue);
    } catch (error) {
      res.status(500).json({ error: "Failed to set custom field value" });
    }
  });

  // ===== AUTOMATION ROUTES =====
  app.get("/api/automations", authMiddleware, async (req, res) => {
    try {
      const automations = await storage.getAllAutomations();
      res.json(automations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch automations" });
    }
  });

  app.post("/api/automations", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const createdBy = req.auth!.userId;
      const validatedData = insertAutomationSchema.parse({
        ...req.body,
        createdBy
      });
      const automation = await storage.createAutomation(validatedData);
      res.status(201).json(automation);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create automation" });
    }
  });

  app.patch("/api/automations/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const automation = await storage.updateAutomation(id, req.body);
      if (!automation) {
        return res.status(404).json({ error: "Automation not found" });
      }
      res.json(automation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update automation" });
    }
  });

  app.delete("/api/automations/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAutomation(id);
      if (!deleted) {
        return res.status(404).json({ error: "Automation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete automation" });
    }
  });

  // ===== NOTIFICATION ROUTES =====
  app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      
      wsManager.broadcastToUser(notification.userId, { 
        type: 'notification_created', 
        payload: notification 
      });
      
      res.status(201).json(notification);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  app.delete("/api/notifications/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNotification(id);
      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ===== SWIMLANE ROUTES =====
  app.get("/api/swimlanes", authMiddleware, async (req, res) => {
    try {
      const swimlanes = await storage.getAllSwimlanes();
      res.json(swimlanes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch swimlanes" });
    }
  });

  app.post("/api/swimlanes", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertSwimlaneSchema.parse(req.body);
      const swimlane = await storage.createSwimlane(validatedData);
      res.status(201).json(swimlane);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create swimlane" });
    }
  });

  app.patch("/api/swimlanes/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const swimlane = await storage.updateSwimlane(id, req.body);
      if (!swimlane) {
        return res.status(404).json({ error: "Swimlane not found" });
      }
      res.json(swimlane);
    } catch (error) {
      res.status(500).json({ error: "Failed to update swimlane" });
    }
  });

  app.delete("/api/swimlanes/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSwimlane(id);
      if (!deleted) {
        return res.status(404).json({ error: "Swimlane not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete swimlane" });
    }
  });

  // ===== ANALYTICS ROUTES =====
  app.get("/api/analytics/cumulative-flow", authMiddleware, async (req, res) => {
    try {
      const data = await storage.getProcessCountByStatusAndDate();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cumulative flow data" });
    }
  });

  // ===== DASHBOARD WIDGET ROUTES =====
  app.get("/api/dashboard/widgets", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      let widgets = await storage.getDashboardWidgets(userId);
      
      // If user has no widgets, initialize with defaults
      if (widgets.length === 0) {
        widgets = await storage.initializeDefaultWidgets(userId);
      }
      
      res.json(widgets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard widgets" });
    }
  });

  app.post("/api/dashboard/widgets", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      const validatedData = insertDashboardWidgetSchema.parse({
        ...req.body,
        userId
      });
      const widget = await storage.createDashboardWidget(validatedData);
      res.status(201).json(widget);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create widget" });
    }
  });

  app.patch("/api/dashboard/widgets/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const widget = await storage.updateDashboardWidget(id, req.body);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget);
    } catch (error) {
      res.status(500).json({ error: "Failed to update widget" });
    }
  });

  app.delete("/api/dashboard/widgets/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDashboardWidget(id);
      if (!deleted) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete widget" });
    }
  });

  app.post("/api/dashboard/widgets/reorder", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      const { positions } = req.body;
      if (!Array.isArray(positions)) {
        return res.status(400).json({ error: "positions must be an array" });
      }
      await storage.updateWidgetPositions(userId, positions);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder widgets" });
    }
  });

  app.post("/api/dashboard/widgets/reset", authMiddleware, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      // Delete all existing widgets for this user
      const existingWidgets = await storage.getDashboardWidgets(userId);
      for (const widget of existingWidgets) {
        await storage.deleteDashboardWidget(widget.id);
      }
      // Create default widgets
      const widgets = await storage.initializeDefaultWidgets(userId);
      res.json(widgets);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset widgets" });
    }
  });

  return httpServer;
}
