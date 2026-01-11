import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";
import { hashPassword } from "../password";
import { sendProvisionalPasswordEmail } from "../email";
import { fromError } from "zod-validation-error";
import { insertProfileSchemaForApi, adminUpdateProfileSchema } from "@shared/schema";

export const usersRouter = Router();

// Get all profiles
usersRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const profiles = await storage.getAllProfiles();
        const sanitizedProfiles = profiles.map(({ password, provisionalPassword, provisionalPasswordExpiresAt, ...profile }) => profile);
        res.json(sanitizedProfiles);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profiles" });
    }
});

// Create profile (Admin only)
usersRouter.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const validatedData = insertProfileSchemaForApi.parse(req.body);

        // Generate provisional password for new users
        const provisionalPassword = Math.random().toString(36).slice(-8).toUpperCase();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const hashedProvisionalPassword = await hashPassword(provisionalPassword);

        // User must use the provisional password to login initially
        const profile = await storage.createProfile({
            ...validatedData,
            password: hashedProvisionalPassword,
            provisionalPassword: hashedProvisionalPassword,
            provisionalPasswordExpiresAt: expiresAt,
            mustChangePassword: true,
            profileCompleted: false,
        } as any);

        // Send email with provisional password
        const emailSent = await sendProvisionalPasswordEmail(
            profile.email,
            profile.name,
            provisionalPassword,
            expiresAt
        );

        const { password: _, provisionalPassword: __, provisionalPasswordExpiresAt: ___, ...sanitizedProfile } = profile;
        res.status(201).json({ ...sanitizedProfile, emailSent });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: fromError(error).toString() });
        }
        res.status(500).json({ error: "Failed to create profile" });
    }
});

// Update profile
usersRouter.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = adminUpdateProfileSchema.parse(req.body);
        const profile = await storage.updateProfile(id, validatedData);

        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        const { password: _, provisionalPassword: __, provisionalPasswordExpiresAt: ___, ...sanitizedProfile } = profile;
        res.json(sanitizedProfile);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: fromError(error).toString() });
        }
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// Delete profile
usersRouter.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await storage.deleteProfile(id);

        if (!deleted) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete profile" });
    }
});

// Generate provisional password (Admin only)
usersRouter.post("/:id/provisional-password", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const profile = await storage.getProfile(id);

        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        // Generate random provisional password
        const provisionalPassword = Math.random().toString(36).slice(-8).toUpperCase();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const hashedProvisionalPassword = await hashPassword(provisionalPassword);

        const updatedProfile = await storage.updateProfile(id, {
            provisionalPassword: hashedProvisionalPassword,
            provisionalPasswordExpiresAt: expiresAt,
            mustChangePassword: true,
        } as any);

        if (!updatedProfile) {
            return res.status(500).json({ error: "Failed to generate provisional password" });
        }

        // Send email with provisional password
        const emailSent = await sendProvisionalPasswordEmail(
            profile.email,
            profile.name,
            provisionalPassword,
            expiresAt
        );

        res.json({
            provisionalPassword,
            expiresAt,
            emailSent,
            message: emailSent
                ? "Senha provisória gerada e enviada por email. O usuário deve trocá-la em até 24 horas."
                : "Senha provisória gerada. O email não pôde ser enviado, informe a senha manualmente."
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate provisional password" });
    }
});
