import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import { objectStorageService } from "../services";
import path from "path";
import fs from "fs";

// Helper function to check if user can access a process
async function canAccessProcess(userId: string, processId: number): Promise<boolean> {
    const user = await storage.getProfile(userId);
    if (!user) return false;

    // Admin can access all processes
    if (user.role === 'admin') return true;

    const process = await storage.getProcess(processId);
    if (!process) return false;

    // User can access if they belong to the same unit or are responsible
    return process.unit === user.unit || process.responsibleId === userId;
}

export const attachmentsRouter = Router();

// Download attachment
attachmentsRouter.get("/:id/download", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const attachment = await storage.getAttachment(id);
        if (!attachment) {
            return res.status(404).json({ error: "Attachment not found" });
        }

        // Check process access authorization
        if (!await canAccessProcess(userId, attachment.processId)) {
            return res.status(403).json({ error: "Access denied to this attachment" });
        }

        // Handle Object Storage files
        if (attachment.fileUrl.startsWith("/objects/")) {
            try {
                const objectFile = await objectStorageService.getObjectEntityFile(attachment.fileUrl);

                // Set content disposition for download
                res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);

                await objectStorageService.downloadObject(objectFile, res);
            } catch (error) {
                console.error("Error downloading from Object Storage:", error);
                return res.status(404).json({ error: "File not found in storage" });
            }
        } else if (attachment.fileUrl.startsWith("/uploads/")) {
            // Legacy local file - check if file exists
            const uploadDir = path.join(process.cwd(), "client/public/uploads");
            const fileName = attachment.fileUrl.replace("/uploads/", "");
            const filePath = path.join(uploadDir, fileName);

            if (fs.existsSync(filePath)) {
                // File exists locally, stream it
                res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
            } else {
                // Legacy file was lost (common in production deployments)
                return res.status(410).json({
                    error: "Este arquivo foi enviado antes da migração para armazenamento permanente e não está mais disponível. Por favor, faça upload do arquivo novamente.",
                    code: "LEGACY_FILE_UNAVAILABLE"
                });
            }
        } else {
            return res.status(400).json({ error: "Invalid file URL format" });
        }
    } catch (error) {
        console.error("Error downloading attachment:", error);
        res.status(500).json({ error: "Failed to download attachment" });
    }
});

// Delete attachment
attachmentsRouter.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const attachment = await storage.getAttachment(id);
        if (!attachment) {
            return res.status(404).json({ error: "Attachment not found" });
        }

        // Check process access authorization
        if (!await canAccessProcess(userId, attachment.processId)) {
            return res.status(403).json({ error: "Access denied to delete this attachment" });
        }

        const deleted = await storage.deleteAttachment(id);
        if (!deleted) {
            return res.status(404).json({ error: "Attachment not found" });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete attachment" });
    }
});
