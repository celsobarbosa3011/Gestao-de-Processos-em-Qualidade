import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertDashboardWidgetSchema } from "@shared/schema";

export const dashboardWidgetsRouter = Router();

// Get widgets
dashboardWidgetsRouter.get("/", authMiddleware, async (req, res) => {
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

// Create widget
dashboardWidgetsRouter.post("/", authMiddleware, async (req, res) => {
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

// Update widget
dashboardWidgetsRouter.patch("/:id", authMiddleware, async (req, res) => {
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

// Delete widget
dashboardWidgetsRouter.delete("/:id", authMiddleware, async (req, res) => {
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

// Reorder widgets
dashboardWidgetsRouter.post("/reorder", authMiddleware, async (req, res) => {
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

// Reset widgets
dashboardWidgetsRouter.post("/reset", authMiddleware, async (req, res) => {
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
