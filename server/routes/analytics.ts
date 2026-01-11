import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";

export const analyticsRouter = Router();

// Cumulative flow
analyticsRouter.get("/cumulative-flow", authMiddleware, async (req, res) => {
    try {
        const data = await storage.getProcessCountByStatusAndDate();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch cumulative flow data" });
    }
});
