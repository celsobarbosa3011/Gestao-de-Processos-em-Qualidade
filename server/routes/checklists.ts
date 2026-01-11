import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";

export const checklistsRouter = Router();

// Update checklist item
checklistsRouter.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { completed } = req.body;
        if (typeof completed !== 'boolean') {
            return res.status(400).json({ error: "Completed must be a boolean" });
        }
        const checklist = await storage.updateChecklist(id, completed);
        if (!checklist) {
            return res.status(404).json({ error: "Checklist item not found" });
        }
        res.json(checklist);
    } catch (error) {
        res.status(500).json({ error: "Failed to update checklist item" });
    }
});

// Delete checklist item
checklistsRouter.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteChecklist(id);
        if (!deleted) {
            return res.status(404).json({ error: "Checklist item not found" });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete checklist item" });
    }
});
