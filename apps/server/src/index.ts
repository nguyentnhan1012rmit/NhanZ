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

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/app", appRoutes);

app.get("/", (req, res) => {
    res.send("NhanZ API is running");
});


io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

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

            // Broadcast to all (or specific room if we implemented rooms)
            // For now, Echo to everyone for the "Community Chat"
            io.emit("receive_message", {
                id: savedMessage.id,
                text: savedMessage.content,
                senderId: savedMessage.senderId,
                timestamp: savedMessage.createdAt,
                sender: savedMessage.sender
            });
        } catch (error) {
            console.error("Error saving message", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
