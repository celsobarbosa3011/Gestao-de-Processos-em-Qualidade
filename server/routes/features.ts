import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";

export const featuresRouter = Router();

// Get features
featuresRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const features = await storage.getAllFeatureToggles();
        res.json(features);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch features" });
    }
});

// Update feature
featuresRouter.patch("/:featureKey", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { featureKey } = req.params;
        const { enabled } = req.body;
        const feature = await storage.updateFeatureToggle(featureKey, enabled);
        res.json(feature);
    } catch (error) {
        res.status(500).json({ error: "Failed to update feature" });
    }
});
