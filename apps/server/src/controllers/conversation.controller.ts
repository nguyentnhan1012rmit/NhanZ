import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Get all conversations for the current user
export const getMyConversations = async (req: Request, res: Response) => {
    // We need the userId from the token. Authenticated middleware should attach it.
    // For now, we'll trust the query param or header until we have proper middleware typing
    // TODO: Use req.user.id from middleware
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                members: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                                name: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
};

// Create or get existing 1-1 conversation
export const createOrGetConversation = async (req: Request, res: Response) => {
    const { targetUserId } = req.body;
    const currentUserId = req.headers['x-user-id'] as string;

    if (!currentUserId || !targetUserId) {
        return res.status(400).json({ error: "Missing user IDs" });
    }

    try {
        // Check if conversation exists
        const existing = await prisma.conversation.findFirst({
            where: {
                isGroup: false,
                AND: [
                    { members: { some: { userId: currentUserId } } },
                    { members: { some: { userId: targetUserId } } }
                ]
            }
        });

        if (existing) {
            return res.json(existing);
        }

        // Create new
        const conversation = await prisma.conversation.create({
            data: {
                isGroup: false,
                members: {
                    create: [
                        { userId: currentUserId },
                        { userId: targetUserId }
                    ]
                }
            }
        });

        res.json(conversation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create conversation" });
    }
};
