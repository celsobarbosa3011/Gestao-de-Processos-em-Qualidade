import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import {
    insertProcessSchema,
    updateProcessSchema,
    insertProcessCommentSchema,
    insertProcessChecklistSchema,
    insertTimeEntrySchema
} from "@shared/schema";
import { wsManager } from "../websocket";
import { upload } from "./uploads";
import { objectStorageService } from "../services";
import path from "path";

export const processesRouter = Router();

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

// Get all processes
processesRouter.get("/", async (req, res) => {
    try {
        const processes = await storage.getAllProcesses();
        res.json(processes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch processes" });
    }
});

// Get process by ID
processesRouter.get("/:id", async (req, res) => {
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

// Create process
processesRouter.post("/", async (req, res) => {
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

// Update process
processesRouter.patch("/:id", async (req, res) => {
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

// --- Comments ---
processesRouter.get("/:id/comments", async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const comments = await storage.getCommentsByProcess(processId);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

processesRouter.post("/:id/comments", async (req, res) => {
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

// --- Events ---
processesRouter.get("/:id/events", async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const events = await storage.getEventsByProcess(processId);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

// --- Checklists ---
processesRouter.get("/:id/checklists", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const checklists = await storage.getChecklistsByProcess(processId);
        res.json(checklists);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch checklists" });
    }
});

processesRouter.post("/:id/checklists", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
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

// --- Attachments ---
processesRouter.get("/:id/attachments", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!await canAccessProcess(userId, processId)) {
            return res.status(403).json({ error: "Access denied to this process" });
        }

        const attachments = await storage.getAttachmentsByProcess(processId);
        res.json(attachments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch attachments" });
    }
});

processesRouter.post("/:id/attachments/request-url", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

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

processesRouter.post("/:id/attachments/save", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (!await canAccessProcess(userId, processId)) {
            return res.status(403).json({ error: "Access denied to this process" });
        }

        const { objectPath, fileName, fileType, fileSize } = req.body;

        if (!objectPath || !fileName) {
            return res.status(400).json({ error: "Missing required fields: objectPath, fileName" });
        }

        try {
            // Set private ACL policy
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

// Legacy upload route
processesRouter.post("/:id/attachments", authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const userId = req.auth?.userId;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

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

// --- Labels (Process specific) ---
processesRouter.get("/:id/labels", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const labels = await storage.getLabelsByProcess(processId);
        res.json(labels);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch process labels" });
    }
});

processesRouter.post("/:id/labels/:labelId", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const labelId = parseInt(req.params.labelId);
        const junction = await storage.addLabelToProcess(processId, labelId);
        res.json(junction);
    } catch (error) {
        res.status(500).json({ error: "Failed to add label to process" });
    }
});

processesRouter.delete("/:id/labels/:labelId", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
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

// --- Time Entries (Process specific) ---
processesRouter.get("/:id/time-entries", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const entries = await storage.getTimeEntriesByProcess(processId);
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch time entries" });
    }
});

processesRouter.post("/:id/time-entries", authMiddleware, async (req, res) => {
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

processesRouter.get("/:id/total-time", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const totalMinutes = await storage.getTotalTimeByProcess(processId);
        res.json({ totalMinutes });
    } catch (error) {
        res.status(500).json({ error: "Failed to get total time" });
    }
});

// --- Custom Field Values ---
processesRouter.get("/:id/custom-field-values", authMiddleware, async (req, res) => {
    try {
        const processId = parseInt(req.params.id);
        const values = await storage.getCustomFieldValues(processId);
        res.json(values);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch custom field values" });
    }
});

processesRouter.post("/:id/custom-field-values", authMiddleware, async (req, res) => {
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
