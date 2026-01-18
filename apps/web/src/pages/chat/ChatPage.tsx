import { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface Message {
    text: string;
    senderId: string;
    timestamp: Date;
}

export default function ChatPage() {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");

    useEffect(() => {
        if (!socket) return;

        socket.on("receive_message", (data: Message) => {
            console.log("Receive:", data);
            setMessages((prev) => [...prev, data]);
        });

        return () => {
            socket.off("receive_message");
        };
    }, [socket]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket) return;

        const messageData = {
            text: inputText,
            senderId: socket.id || "anonymous",
            timestamp: new Date(),
        };

        socket.emit("send_message", messageData);
        setInputText("");
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 p-4">
            <Card className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
                <CardHeader className="border-b">
                    <CardTitle className="flex justify-between items-center">
                        <span>NhanZ Chat</span>
                        <span className={`text-sm font-normal px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isConnected ? "Online" : "Connecting..."}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.senderId === socket?.id ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.senderId === socket?.id
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-200 text-slate-900"
                                        }`}
                                >
                                    <p>{msg.text}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                        {msg.senderId === socket?.id ? "You" : msg.senderId.substring(0, 6)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 mt-10">
                                No messages yet. Say hello!
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t bg-white">
                        <form onSubmit={sendMessage} className="flex gap-2">
                            <Input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1"
                            />
                            <Button type="submit" disabled={!isConnected || !inputText.trim()}>
                                Send
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
