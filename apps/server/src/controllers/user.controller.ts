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
};
