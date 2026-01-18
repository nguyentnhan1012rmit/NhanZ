import { Request, Response } from "express";
import { RegisterSchema, LoginSchema } from "@nhanz/shared";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SC_JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const register = async (req: Request, res: Response) => {
    try {
        const data = RegisterSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: data.email }, { username: data.username }],
            },
        });

        if (existingUser) {
            return res.status(400).json({ error: "Email or username already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                password: hashedPassword,
                name: data.username, // Default name to username
            },
        });

        // Generate Token
        const token = jwt.sign({ userId: user.id }, SC_JWT_SECRET, { expiresIn: "7d" });

        res.json({
            message: "Registration successful",
            token,
            user: { id: user.id, email: user.email, username: user.username, name: user.name, avatar: user.avatar },
        });
    } catch (error: any) {
        console.error("Register Error:", error);
        res.status(400).json({ error: error.errors?.[0]?.message || error.message || "Registration failed" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const data = LoginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Check password
        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate Token
        const token = jwt.sign({ userId: user.id }, SC_JWT_SECRET, { expiresIn: "7d" });

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, email: user.email, username: user.username, name: user.name, avatar: user.avatar },
        });
    } catch (error: any) {
        console.error("Login Error:", error);
        res.status(400).json({ error: error.errors?.[0]?.message || error.message || "Login failed" });
    }
};
