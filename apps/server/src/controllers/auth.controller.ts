import { Request, Response } from "express";
import { RegisterSchema, LoginSchema } from "@nhanz/shared";

export const register = async (req: Request, res: Response) => {
    try {
        const data = RegisterSchema.parse(req.body);
        // TODO: Register logic with Supabase/DB
        console.log("Registering user:", data.email);
        res.json({ message: "Registration successful", user: { email: data.email, id: "mock-id" } });
    } catch (error: any) {
        res.status(400).json({ error: error.errors || error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const data = LoginSchema.parse(req.body);
        // TODO: Login logic
        console.log("Logging in user:", data.email);
        res.json({ message: "Login successful", token: "mock-jwt-token" });
    } catch (error: any) {
        res.status(400).json({ error: error.errors || error.message });
    }
};
