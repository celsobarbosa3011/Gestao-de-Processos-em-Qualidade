import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertCustomFieldSchema } from "@shared/schema";

export const customFieldsRouter = Router();

// Get custom fields
customFieldsRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const fields = await storage.getAllCustomFields();
        res.json(fields);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch custom fields" });
    }
});

// Create custom field
customFieldsRouter.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const validatedData = insertCustomFieldSchema.parse(req.body);
        const field = await storage.createCustomField(validatedData);
        res.status(201).json(field);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: fromError(error).toString() });
        }
        res.status(500).json({ error: "Failed to create custom field" });
    }
});

// Update custom field
customFieldsRouter.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const field = await storage.updateCustomField(id, req.body);
        if (!field) {
            return res.status(404).json({ error: "Custom field not found" });
        }
        res.json(field);
    } catch (error) {
        res.status(500).json({ error: "Failed to update custom field" });
    }
});

// Delete custom field
customFieldsRouter.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteCustomField(id);
        if (!deleted) {
            return res.status(404).json({ error: "Custom field not found" });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete custom field" });
    }
});
