import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertPrioritySchema, updatePrioritySchema } from "@shared/schema";

export const prioritiesRouter = Router();

// Get priorities
prioritiesRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const priorities = await storage.getAllPriorities();
        res.json(priorities);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch priorities" });
    }
});

// Create priority
prioritiesRouter.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
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

// Update priority
prioritiesRouter.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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

// Delete priority
prioritiesRouter.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
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
