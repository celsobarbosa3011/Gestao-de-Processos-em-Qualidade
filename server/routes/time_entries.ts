import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";

export const timeEntriesRouter = Router();

// Delete time entry
timeEntriesRouter.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteTimeEntry(id);
        if (!deleted) {
            return res.status(404).json({ error: "Time entry not found" });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete time entry" });
    }
});
