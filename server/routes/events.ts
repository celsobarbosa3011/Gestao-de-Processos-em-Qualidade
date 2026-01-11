import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";

export const eventsRouter = Router();

// Get all events
eventsRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const events = await storage.getAllEvents();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events" });
    }
});
