import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertAutomationSchema } from "@shared/schema";

export const automationsRouter = Router();

// Get automations
automationsRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const automations = await storage.getAllAutomations();
        res.json(automations);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch automations" });
    }
});

// Create automation
automationsRouter.post("/", authMiddleware, adminMiddleware, async (req, res) => {
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

// Update automation
automationsRouter.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
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

// Delete automation
automationsRouter.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
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
