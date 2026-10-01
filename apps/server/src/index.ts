import express from "express"; // Restart trigger
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    },
});

import authRoutes from "./routes/auth.routes";
import appRoutes from "./routes/app.routes";
import messageRoutes from "./routes/message.routes";
import prisma from "./lib/prisma";
import { authMiddleware } from "./lib/authMiddleware";

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", authMiddleware, messageRoutes);
app.use("/api/app", authMiddleware, appRoutes);

app.get("/", (req, res) => {
    res.send("NhanZ API is running");
});

const userSockets = new Map<string, Set<string>>();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    let currentUserId: string | null = null;

    socket.on("user_online", (userId: string) => {
        currentUserId = userId;
        
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
            // Broadcast that this user is online
            io.emit("user_online", userId);
        }
        userSockets.get(userId)!.add(socket.id);
        
        // Send the current online users to this socket
        const onlineUsers = Array.from(userSockets.keys());
        socket.emit("get_online_users", onlineUsers);
    });

    // User joins a room (we'll use this later, for now everything is global)
    socket.on("join_room", (data) => {
        socket.join(data);
        console.log(`User ${socket.id} joined room: ${data}`);
    });

    socket.on("typing", (data) => {
        // data: { conversationId, username }
        // Broadcast to everyone in the room except sender
        socket.to(data.conversationId).emit("typing", data);
    });

    socket.on("stop_typing", (data) => {
        socket.to(data.conversationId).emit("stop_typing", data);
    });

    socket.on("send_message", async (data) => {
        console.log("Message received:", data);

        try {
            // Save to DB
            const savedMessage = await prisma.message.create({
                data: {
                    content: data.text,
                    senderId: data.senderId,
                    conversationId: data.conversationId,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                        },
                    }
                }
            });

            // Broadcast to specific room
            io.to(data.conversationId).emit("receive_message", {
                id: savedMessage.id,
                text: savedMessage.content,
                senderId: savedMessage.senderId,
                conversationId: savedMessage.conversationId,
                timestamp: savedMessage.createdAt,
                sender: savedMessage.sender
            });
        } catch (error) {
            console.error("Error saving message", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (currentUserId) {
            const sockets = userSockets.get(currentUserId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(currentUserId);
                    io.emit("user_offline", currentUserId);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
