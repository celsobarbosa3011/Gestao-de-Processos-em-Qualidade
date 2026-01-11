import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, adminMiddleware } from "../auth";

export const permissionsRouter = Router();

// Get all permissions
permissionsRouter.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const permissions = await storage.getAllPermissions();
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch permissions" });
    }
});

// Get role permissions
permissionsRouter.get("/role/:role", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const role = req.params.role;
        const permissions = await storage.getRolePermissions(role);
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch role permissions" });
    }
});

// Set role permission
permissionsRouter.post("/role/:role", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const role = req.params.role;
        const { permissionKey } = req.body;
        const rolePermission = await storage.setRolePermission(role, permissionKey);
        res.json(rolePermission);
    } catch (error) {
        res.status(500).json({ error: "Failed to set role permission" });
    }
});

// Remove role permission
permissionsRouter.delete("/role/:role/:permissionKey", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { role, permissionKey } = req.params;
        const deleted = await storage.removeRolePermission(role, permissionKey);
        res.json({ success: deleted });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove role permission" });
    }
});

// Get user permissions
permissionsRouter.get("/user/:userId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        const permissions = await storage.getUserPermissions(userId);
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user permissions" });
    }
});

// Set user permission
permissionsRouter.post("/user/:userId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { permissionKey, granted } = req.body;
        const userPermission = await storage.setUserPermission(userId, permissionKey, granted);
        res.json(userPermission);
    } catch (error) {
        res.status(500).json({ error: "Failed to set user permission" });
    }
});
