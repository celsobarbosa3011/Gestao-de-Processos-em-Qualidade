import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";

export const templatesRouter = Router();

// Get templates
templatesRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const templates = await storage.getAllTemplates();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch templates" });
    }
});

// Create template
templatesRouter.post("/", authMiddleware, adminMiddleware, async (req, res) => {
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

// Update template
templatesRouter.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
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

// Delete template
templatesRouter.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteTemplate(id);
        res.json({ success: deleted });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete template" });
    }
});
