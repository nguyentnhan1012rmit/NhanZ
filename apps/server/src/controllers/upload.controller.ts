import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import prisma from "../lib/prisma";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer (Memory Storage)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Hack to avoid type issues for now
interface AuthenticatedRequest extends Request {
    file?: any;
}

export const updateAvatar = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
        const userId = req.headers['x-user-id'] as string;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!authReq.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Upload to Cloudinary
        // Convert buffer to base64 for cloudinary upload or use stream
        const b64 = Buffer.from(authReq.file.buffer).toString("base64");
        const dataURI = "data:" + authReq.file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "nhanz_avatars",
            public_id: `avatar_${userId}`,
            overwrite: true,
            transformation: [
                { width: 300, height: 300, crop: "fill", gravity: "face" } // Auto crop to face
            ]
        });

        // Update User in DB
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar: result.secure_url }
        });

        res.json({ avatar: updatedUser.avatar, message: "Avatar updated successfully" });

    } catch (error) {
        console.error("Upload failed:", error);
        res.status(500).json({ error: "Failed to upload avatar" });
    }
};
