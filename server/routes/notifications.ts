import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertNotificationSchema } from "@shared/schema";
import { wsManager } from "../websocket";

export const notificationsRouter = Router();

// Get notifications
notificationsRouter.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.auth!.userId;
        const notifications = await storage.getNotificationsByUser(userId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Create notification (internal or test use mostly)
notificationsRouter.post("/", authMiddleware, async (req, res) => {
    try {
        const validatedData = insertNotificationSchema.parse(req.body);
        const notification = await storage.createNotification(validatedData);

        wsManager.broadcastToUser(notification.userId, {
            type: 'notification_created',
            payload: notification
        });

        res.status(201).json(notification);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ error: fromError(error).toString() });
        }
        res.status(500).json({ error: "Failed to create notification" });
    }
});

// Mark as read
notificationsRouter.patch("/:id/read", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const notification = await storage.markNotificationAsRead(id);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// Mark all as read
notificationsRouter.post("/read-all", authMiddleware, async (req, res) => {
    try {
        const userId = req.auth!.userId;
        await storage.markAllNotificationsAsRead(userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
});

// Get unread count
notificationsRouter.get("/unread-count", authMiddleware, async (req, res) => {
    try {
        const userId = req.auth!.userId;
        const count = await storage.getUnreadNotificationCount(userId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "Failed to get unread count" });
    }
});

// Delete notification
notificationsRouter.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteNotification(id);
        if (!deleted) {
            return res.status(404).json({ error: "Notification not found" });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete notification" });
    }
});
