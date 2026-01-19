import { io } from "socket.io-client";
import { API_URL } from "./lib/api";

export const socket = io(API_URL, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});
