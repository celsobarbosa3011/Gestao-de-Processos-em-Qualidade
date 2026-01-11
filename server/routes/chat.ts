import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import { fromError } from "zod-validation-error";
import { insertChatMessageSchema } from "@shared/schema";
import { stripHtml } from "../sanitize";

export const chatRouter = Router();

// Get messages for current user
chatRouter.get("/messages", authMiddleware, async (req, res) => {
    try {
        const userId = req.auth!.userId;
        const messages = await storage.getChatMessages(userId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// Get conversations
chatRouter.get("/conversations", authMiddleware, async (req, res) => {
    try {
        const userId = req.auth!.userId;
        const conversations = await storage.getUserConversations(userId);
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// Get conversation with specific user
chatRouter.get("/conversation/:userId", authMiddleware, async (req, res) => {
    try {
        const currentUserId = req.auth!.userId;
        const otherUserId = req.params.userId;
        const messages = await storage.getChatConversation(currentUserId, otherUserId);

        // Mark messages as read
        await storage.markMessagesAsRead(otherUserId, currentUserId);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch conversation" });
    }
});

// Send message
chatRouter.post("/messages", authMiddleware, async (req, res) => {
    try {
        const senderId = req.auth!.userId;

        // Validate message payload
        const result = insertChatMessageSchema.pick({
            receiverId: true,
            message: true
        }).safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ error: fromError(result.error).message });
        }

        const { receiverId, message } = result.data;

        // Sanitize message - strip HTML and limit length for XSS prevention
        const sanitizedMessage = stripHtml(message).slice(0, 2000);

        if (!sanitizedMessage) {
            return res.status(400).json({ error: "Message cannot be empty" });
        }

        const chatMessage = await storage.sendChatMessage({
            senderId,
            receiverId: receiverId || null,
            message: sanitizedMessage,
            isRead: false,
        });

        res.json(chatMessage);
    } catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Get unread count
chatRouter.get("/unread", authMiddleware, async (req, res) => {
    try {
        const userId = req.auth!.userId;
        const count = await storage.getUnreadCount(userId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "Failed to get unread count" });
    }
});
