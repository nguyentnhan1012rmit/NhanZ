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
