import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertProcessLabelSchema } from "@shared/schema";

export const labelsRouter = Router();

// Get all labels
labelsRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const labels = await storage.getAllLabels();
        res.json(labels);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch labels" });
    }
});

// Create label
labelsRouter.post("/", authMiddleware, async (req, res) => {
    try {
        const validatedData = insertProcessLabelSchema.parse(req.body);
        const label = await storage.createLabel(validatedData);
        res.json(label);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: fromError(error).toString() });
        }
        res.status(500).json({ error: "Failed to create label" });
    }
});

// Delete label
labelsRouter.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteLabel(id);
        if (!deleted) {
            return res.status(404).json({ error: "Label not found" });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete label" });
    }
});
