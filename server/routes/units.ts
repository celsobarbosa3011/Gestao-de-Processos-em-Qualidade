import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertUnitSchema, updateUnitSchema } from "@shared/schema";

export const unitsRouter = Router();

// Get all units
unitsRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const units = await storage.getAllUnits();
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch units" });
    }
});

// Get unit by ID
unitsRouter.get("/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const unit = await storage.getUnit(id);

        if (!unit) {
            return res.status(404).json({ error: "Unit not found" });
        }

        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch unit" });
    }
});

// Create unit
unitsRouter.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const validatedData = insertUnitSchema.parse(req.body);
        const unit = await storage.createUnit(validatedData);
        res.status(201).json(unit);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: fromError(error).toString() });
        }
        if (error.code === '23505') {
            return res.status(400).json({ error: "CNPJ já cadastrado" });
        }
        res.status(500).json({ error: "Failed to create unit" });
    }
});

// Update unit
unitsRouter.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateUnitSchema.parse(req.body);
        const unit = await storage.updateUnit(id, validatedData);

        if (!unit) {
            return res.status(404).json({ error: "Unit not found" });
        }

        res.json(unit);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: fromError(error).toString() });
        }
        res.status(500).json({ error: "Failed to update unit" });
    }
});

// Delete unit
unitsRouter.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteUnit(id);

        if (!deleted) {
            return res.status(404).json({ error: "Unit not found" });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete unit" });
    }
});
