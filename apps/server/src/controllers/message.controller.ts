import { Request, Response } from "express";
import prisma from "../lib/prisma";
// Get messages for a specific room (or general chat)
export const getMessages = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;

        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                reactions: true,
                replyTo: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};


// Create a default/general conversation if it helps
export const getGeneralConversation = async (req: Request, res: Response) => {
    try {
        let conversation = await prisma.conversation.findFirst({
            where: { name: "Community Chat" },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    name: "Community Chat",
                    isGroup: true,
                },
            });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: "Failed to get general conversation" });
    }
};

// Toggle reaction
export const toggleReaction = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.userId!;

        if (!emoji) return res.status(400).json({ error: "Emoji required" });

        const existing = await prisma.reaction.findUnique({
            where: {
                userId_messageId_emoji: {
                    userId,
                    messageId,
                    emoji
                }
            },
            include: {
                message: {
                    select: { conversationId: true }
                }
            }
        });

        if (existing) {
            await prisma.reaction.delete({ where: { id: existing.id } });
            const payload = { action: "removed", emoji, messageId, userId, conversationId: existing.message.conversationId };
            req.app.get("io").to(existing.message.conversationId).emit("message_reaction", payload);
            res.json(payload);
        } else {
            const msg = await prisma.message.findUnique({ where: { id: messageId } });
            if (!msg) return res.status(404).json({ error: "Message not found" });

            const reaction = await prisma.reaction.create({
                data: { userId, messageId, emoji },
                include: { user: { select: { id: true, username: true, avatar: true } } }
            });
            const payload = { action: "added", reaction, messageId, userId, conversationId: msg.conversationId };
            req.app.get("io").to(msg.conversationId).emit("message_reaction", payload);
            res.json(payload);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to toggle reaction" });
    }
};

// Edit message
export const editMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.userId!;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.senderId !== userId) return res.status(403).json({ error: "Forbidden" });

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { content, editedAt: new Date() },
            include: { sender: { select: { id: true, username: true, avatar: true } }, reactions: true, replyTo: true }
        });

        req.app.get("io").to(updated.conversationId).emit("message_edited", updated);
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to edit message" });
    }
};

// Soft delete message
export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId!;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.senderId !== userId) return res.status(403).json({ error: "Forbidden" });

        const deleted = await prisma.message.update({
            where: { id: messageId },
            data: { deletedAt: new Date(), content: "" }, // Clear content for privacy
            include: { sender: { select: { id: true, username: true, avatar: true } }, reactions: true, replyTo: true }
        });

        req.app.get("io").to(deleted.conversationId).emit("message_deleted", deleted);
        res.json(deleted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete message" });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.userId!;

        const receipt = await prisma.readReceipt.upsert({
            where: {
                userId_conversationId: {
                    userId,
                    conversationId
                }
            },
            update: {
                lastReadAt: new Date()
            },
            create: {
                userId,
                conversationId,
                lastReadAt: new Date()
            }
        });

        req.app.get("io").to(conversationId).emit("messages_read", {
            conversationId,
            userId,
            lastReadAt: receipt.lastReadAt
        });

        res.json(receipt);
    } catch (error) {
        console.error("Mark as read error", error);
        res.status(500).json({ error: "Failed to mark as read" });
    }
};

export const getReadReceipts = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const receipts = await prisma.readReceipt.findMany({
            where: { conversationId }
        });
        res.json(receipts);
    } catch (error) {
        console.error("Fetch read receipts error", error);
        res.status(500).json({ error: "Failed to fetch read receipts" });
    }
};

export const togglePinMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const userId = req.userId!;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: "Message not found" });

        const isPinned = !message.isPinned;

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                isPinned,
                pinnedBy: isPinned ? userId : null,
                pinnedAt: isPinned ? new Date() : null,
            }
        });

        req.app.get("io").to(message.conversationId).emit("message_pinned", {
            messageId,
            conversationId: message.conversationId,
            isPinned,
            pinnedBy: isPinned ? userId : null,
            pinnedAt: updatedMessage.pinnedAt
        });

        res.json(updatedMessage);
    } catch (error) {
        console.error("Toggle pin message error", error);
        res.status(500).json({ error: "Failed to toggle pin" });
    }
};
