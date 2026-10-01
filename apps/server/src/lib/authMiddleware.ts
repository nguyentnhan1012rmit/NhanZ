import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        let token = "";

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        if (token) {
            const secret = process.env.JWT_SECRET || "default_secret";
            const decoded = jwt.verify(token, secret) as { userId: string };
            req.userId = decoded.userId;
        } else {
            // Fallback for backward compatibility
            const headerUserId = req.headers['x-user-id'];
            if (headerUserId && typeof headerUserId === 'string') {
                req.userId = headerUserId;
            } else {
                return res.status(401).json({ error: "Unauthorized: Missing authentication" });
            }
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};
