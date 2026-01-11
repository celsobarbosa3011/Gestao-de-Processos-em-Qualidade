import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import {
    updateAlertSettingsSchema,
    updateBrandingConfigSchema,
    updateWipLimitSchema
} from "@shared/schema";

export const settingsRouter = Router();

// --- Alerts ---
settingsRouter.get("/alerts", async (req, res) => {
    try {
        const settings = await storage.getAlertSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch alert settings" });
    }
});

settingsRouter.patch("/alerts", async (req, res) => {
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

// --- Branding ---
settingsRouter.get("/branding", async (req, res) => {
    try {
        const config = await storage.getBrandingConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch branding config" });
    }
});

settingsRouter.patch("/branding", async (req, res) => {
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

// --- WIP Limits ---
settingsRouter.get("/wip-limits", async (req, res) => {
    try {
        const limits = await storage.getAllWipLimits();
        res.json(limits);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch WIP limits" });
    }
});

settingsRouter.patch("/wip-limits/:columnId", authMiddleware, adminMiddleware, async (req, res) => {
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
