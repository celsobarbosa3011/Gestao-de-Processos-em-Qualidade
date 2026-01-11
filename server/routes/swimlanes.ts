import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertSwimlaneSchema } from "@shared/schema";

export const swimlanesRouter = Router();

// Get swimlanes
swimlanesRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const swimlanes = await storage.getAllSwimlanes();
        res.json(swimlanes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch swimlanes" });
    }
});

// Create swimlane
swimlanesRouter.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const validatedData = insertSwimlaneSchema.parse(req.body);
        const swimlane = await storage.createSwimlane(validatedData);
        res.status(201).json(swimlane);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: fromError(error).toString() });
        }
        res.status(500).json({ error: "Failed to create swimlane" });
    }
});

// Update swimlane
swimlanesRouter.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const swimlane = await storage.updateSwimlane(id, req.body);
        if (!swimlane) {
            return res.status(404).json({ error: "Swimlane not found" });
        }
        res.json(swimlane);
    } catch (error) {
        res.status(500).json({ error: "Failed to update swimlane" });
    }
});

// Delete swimlane
swimlanesRouter.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteSwimlane(id);
        if (!deleted) {
            return res.status(404).json({ error: "Swimlane not found" });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete swimlane" });
    }
});
