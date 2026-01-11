import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertProcessTypeSchema, updateProcessTypeSchema } from "@shared/schema";

export const processTypesRouter = Router();

// Get process types
processTypesRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const types = await storage.getAllProcessTypes();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch process types" });
    }
});

// Create process type
processTypesRouter.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
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

// Update process type
processTypesRouter.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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

// Delete process type
processTypesRouter.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
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
