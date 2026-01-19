import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getAllUsers = async (req: Request, res: Response) => {
    const currentUserId = req.headers['x-user-id'] as string;

    try {
        const users = await prisma.user.findMany({
            where: {
                id: {
                    not: currentUserId // Exclude self
                }
            },
            select: {
                id: true,
                username: true,
                avatar: true,
                name: true
            }
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
}

export const updateProfile = async (req: Request, res: Response) => {
    const currentUserId = req.headers['x-user-id'] as string;
    const { name, username } = req.body;

    if (!currentUserId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await prisma.user.update({
            where: { id: currentUserId },
            data: {
                ...(name && { name }),
                ...(username && { username })
            },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                name: true,
                createdAt: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};
