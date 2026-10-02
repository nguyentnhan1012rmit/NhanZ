import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { socket } from "@/socket";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { sounds } from "@/lib/sounds";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const { user } = useAuthStore();

    useEffect(() => {
        function onConnect() {
            console.log("Socket connected:", socket.id);
            setIsConnected(true);
        }

        function onDisconnect() {
            console.log("Socket disconnected");
            setIsConnected(false);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        socket.on("get_online_users", (users: string[]) => {
            useChatStore.getState().setOnlineUsers(users);
        });

        socket.on("user_online", (userId: string) => {
            useChatStore.getState().addUserOnline(userId);
        });

        socket.on("user_offline", (userId: string) => {
            useChatStore.getState().removeUserOffline(userId);
        });

        socket.on("receive_message", (data: any) => {
            const currentUser = useAuthStore.getState().user;
            if (data.senderId !== currentUser?.id) {
                const { soundEnabled } = useThemeStore.getState();
                if (soundEnabled) {
                    sounds.playNotification();
                }
            }
        });

        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("get_online_users");
            socket.off("user_online");
            socket.off("user_offline");
            socket.off("receive_message");
            // Do not disconnect global socket on provider unmount to prevent React Strict Mode churning
            // It will disconnect naturally on page unload
        };
    }, []);

    useEffect(() => {
        if (isConnected && user?.id) {
            socket.emit("user_online", user.id);
        }
    }, [isConnected, user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
