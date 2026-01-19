import { z } from "zod";

export const UserSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(3).max(16).regex(/^[a-z0-9]+$/, "Username must be lowercase alphanumeric"),
    email: z.string().email(),
    avatar: z.string().url().optional(),
    status: z.string().max(100).optional(),
    name: z.string().max(50).optional(),
    createdAt: z.date(),
});

export const RegisterSchema = z.object({
    username: z.string().min(3).max(16).regex(/^[a-z0-9]+$/, "Username must be lowercase alphanumeric"),
    name: z.string().min(1, "Name is required").max(50),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export type User = z.infer<typeof UserSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
