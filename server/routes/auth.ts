import { Router } from "express";
import { storage } from "../storage";
import { generateToken, authMiddleware, adminMiddleware } from "../auth";
import { hashPassword, verifyPassword, isHashed } from "../password";
import { sendProvisionalPasswordEmail } from "../email";
import { z } from "zod";
import { fromError } from "zod-validation-error";

export const authRouter = Router();

// Login
authRouter.post("/login", async (req, res) => {
    try {
        // Sanitize inputs
        const email = (req.body.email || '').trim().toLowerCase();
        const password = (req.body.password || '').toString().trim();

        console.log(`[auth] Login attempt`);

        const profile = await storage.getProfileByEmail(email);

        if (!profile) {
            console.log(`[auth] Login failed — email not found`);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        let isValidPassword = false;
        let usedProvisionalPassword = false;

        // Check regular password
        if (profile.password) {
            if (isHashed(profile.password)) {
                isValidPassword = await verifyPassword(password, profile.password);
            } else {
                isValidPassword = profile.password === password;
                // Migrate to hashed password on successful login
                if (isValidPassword) {
                    const hashedPassword = await hashPassword(password);
                    await storage.updateProfile(profile.id, { password: hashedPassword } as any);
                }
            }
        }

        // Check provisional password if regular failed
        if (!isValidPassword && profile.provisionalPassword) {
            const now = new Date();
            const expiresAt = profile.provisionalPasswordExpiresAt;

            let provisionalMatch = false;
            if (isHashed(profile.provisionalPassword)) {
                provisionalMatch = await verifyPassword(password, profile.provisionalPassword);
            } else {
                provisionalMatch = profile.provisionalPassword === password;
            }

            if (provisionalMatch) {
                if (expiresAt && now > expiresAt) {
                    return res.status(401).json({ error: "Senha provisória expirada. Contate o administrador." });
                }
                isValidPassword = true;
                usedProvisionalPassword = true;
            }
        }

        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const mustChange = profile.mustChangePassword || usedProvisionalPassword;

        // Lookup unitId from units table (profile.unit pode ser ID numérico ou nome)
        const parsedUnitId = profile.unit ? parseInt(profile.unit, 10) : NaN;
        let resolvedUnitId: number | null = null;
        if (!isNaN(parsedUnitId)) {
            resolvedUnitId = parsedUnitId; // já é um ID numérico
        } else if (profile.unit) {
            // Tenta buscar pelo nome/CNPJ
            try {
                const allUnits = await storage.getAllUnits();
                const match = allUnits.find((u: any) =>
                    u.cnpj === profile.unit ||
                    u.nomeFantasia?.toLowerCase() === profile.unit?.toLowerCase() ||
                    u.razaoSocial?.toLowerCase() === profile.unit?.toLowerCase()
                );
                resolvedUnitId = match ? match.id : null;
            } catch { resolvedUnitId = null; }
        }

        // Generate JWT token
        const token = generateToken({
            userId: profile.id,
            email: profile.email,
            role: profile.role,
            mustChangePassword: mustChange,
            unitId: profile.role === "admin" ? null : resolvedUnitId,
            unitLabel: profile.unit ?? undefined,
        });

        // Don't send password back
        const { password: _, provisionalPassword: __, ...profileWithoutPassword } = profile;
        res.json({
            ...profileWithoutPassword,
            mustChangePassword: mustChange,
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Register
authRouter.post("/register", async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        const registerSchema = z.object({
            name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
            email: z.string().email("Email inválido"),
            password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
            confirmPassword: z.string().min(1, "Confirmação de senha obrigatória"),
        }).refine((data) => data.password === data.confirmPassword, {
            message: "As senhas não coincidem",
            path: ["confirmPassword"],
        });

        const validation = registerSchema.safeParse({ name, email, password, confirmPassword });
        if (!validation.success) {
            const validationError = fromError(validation.error);
            return res.status(400).json({ error: validationError.toString() });
        }

        const validatedData = validation.data;
        const sanitizedEmail = validatedData.email.trim().toLowerCase();

        const existingProfile = await storage.getProfileByEmail(sanitizedEmail);
        if (existingProfile) {
            return res.status(409).json({ error: "Este email já está cadastrado" });
        }

        const hashedPassword = await hashPassword(validatedData.password);

        const newProfile = await storage.createProfile({
            name: validatedData.name.trim(),
            email: sanitizedEmail,
            password: hashedPassword,
            role: 'user',
            unit: 'pendente',
            status: 'active',
            profileCompleted: false,
            mustChangePassword: false,
        });

        const token = generateToken({
            userId: newProfile.id,
            email: newProfile.email,
            role: newProfile.role,
            mustChangePassword: false,
        });

        const { password: _, provisionalPassword: __, ...profileWithoutPassword } = newProfile;
        res.status(201).json({
            ...profileWithoutPassword,
            token,
        });
    } catch (error: any) {
        console.error('[auth] Registration error:', error);
        res.status(500).json({ error: "Erro ao criar conta. Tente novamente." });
    }
});

// Change Password
authRouter.post("/change-password", authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.auth!.userId;

        if (!newPassword || !currentPassword) {
            return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: "A nova senha deve ter pelo menos 8 caracteres" });
        }

        const profile = await storage.getProfile(userId);
        if (!profile) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        let isValidCredential = false;

        // Check regular password
        if (profile.password) {
            if (isHashed(profile.password)) {
                isValidCredential = await verifyPassword(currentPassword, profile.password);
            } else {
                isValidCredential = profile.password === currentPassword;
            }
        }

        // Check provisional password
        if (!isValidCredential && profile.provisionalPassword) {
            let provisionalMatch = false;
            if (isHashed(profile.provisionalPassword)) {
                provisionalMatch = await verifyPassword(currentPassword, profile.provisionalPassword);
            } else {
                provisionalMatch = profile.provisionalPassword === currentPassword;
            }

            if (provisionalMatch) {
                const now = new Date();
                const expiresAt = profile.provisionalPasswordExpiresAt;
                if (expiresAt && now <= expiresAt) {
                    isValidCredential = true;
                } else if (expiresAt && now > expiresAt) {
                    return res.status(401).json({ error: "Senha provisória expirada. Contate o administrador." });
                }
            }
        }

        if (!isValidCredential) {
            return res.status(401).json({ error: "Senha atual incorreta" });
        }

        const hashedPassword = await hashPassword(newPassword);

        const updatedProfile = await storage.updateProfile(userId, {
            password: hashedPassword,
            provisionalPassword: null,
            provisionalPasswordExpiresAt: null,
            mustChangePassword: false,
        } as any);

        if (!updatedProfile) {
            return res.status(500).json({ error: "Falha ao atualizar senha" });
        }

        const newToken = generateToken({
            userId: updatedProfile.id,
            email: updatedProfile.email,
            role: updatedProfile.role,
            mustChangePassword: false,
        });

        const { password: _, provisionalPassword: __, provisionalPasswordExpiresAt: ___, ...sanitizedProfile } = updatedProfile;
        res.json({ ...sanitizedProfile, token: newToken });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
