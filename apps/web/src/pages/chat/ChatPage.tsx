import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, Video, MoreVertical, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/useAuthStore";

interface Message {
    text: string;
    senderId: string;
    timestamp: Date;
    sender?: { // Logic backend returns sender object
        username: string;
        avatar?: string;
    }
}

import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
    const { socket, isConnected } = useSocket();
    const { user } = useAuthStore();
    const { activeConversationId, updateConversationLastMessage, typingUsers, setTyping, conversations } = useChatStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");

    // Local state to track which conversation we are currently showing messages for
    // This helps avoid race conditions or flickering when switching
    const [currentConvId, setCurrentConvId] = useState<string | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch messages when activeConversationId changes
    useEffect(() => {
        if (!activeConversationId) return;

        // Reset text when switching chats (optional, but good UX)
        setInputText("");

        const loadMessages = async () => {
            try {
                const res = await api.get(`/api/messages/${activeConversationId}`);
                const mappedMessages = res.data.map((m: any) => ({
                    text: m.content,
                    senderId: m.senderId,
                    timestamp: m.createdAt,
                    sender: m.sender
                }));
                setMessages(mappedMessages);
                setCurrentConvId(activeConversationId);

                // Join socket room
                if (socket) {
                    socket.emit("join_room", activeConversationId);
                }

            } catch (error) {
                console.error("Failed to load messages", error);
            }
        };

        loadMessages();
    }, [activeConversationId, socket]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);

        if (!socket || !activeConversationId || !user) return;

        // Emit typing
        socket.emit("typing", { conversationId: activeConversationId, username: user.username });

        // Debounce stop typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop_typing", { conversationId: activeConversationId, username: user.username });
        }, 2000);
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("receive_message", (data: any) => {
            // Ignore my own messages (handled optimistically)
            if (data.senderId === user?.id) return;

            // Only append if it belongs to current conversation
            if (data.conversationId === activeConversationId || activeConversationId === null) {
                // Wait, if activeConversationId is null, we shouldn't act?
                // If matches, append to UI
            }

            // BUT ALWAYS update sidebar last message regardless of active chat
            // We need conversationId in data
            if (data.conversationId) {
                updateConversationLastMessage(data.conversationId, {
                    content: data.text,
                    createdAt: data.timestamp
                });
            }

            // If this message belongs to active chat, add to list
            if (currentConvId && data.conversationId === currentConvId) {
                setMessages((prev) => [...prev, data]);
            }
        });

        socket.on("typing", (data: any) => {
            setTyping(data.conversationId, data.username, true);
        });

        socket.on("stop_typing", (data: any) => {
            setTyping(data.conversationId, data.username, false);
        });

        return () => {
            socket.off("receive_message");
            socket.off("typing");
            socket.off("stop_typing");
        };
    }, [socket, currentConvId, updateConversationLastMessage, setTyping]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket || !user || !activeConversationId) return;

        const messageData = {
            text: inputText,
            senderId: user.id,
            conversationId: activeConversationId,
            timestamp: new Date(),
        };

        // Optimistic Update
        setMessages((prev) => [...prev, {
            ...messageData,
            sender: { username: user.username, avatar: user.avatar }
        } as Message]);

        socket.emit("send_message", messageData);
        setInputText("");
    };

    if (!activeConversationId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
                <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Select a contact to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            {/* Chat Header */}
            <div className="h-16 border-b bg-white flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        {(() => {
                            const conv = conversations.find(c => c.id === activeConversationId);
                            const other = conv?.members?.find((m: any) => m.user.username !== user?.username)?.user;
                            const name = conv?.isGroup ? conv.name : other?.name || other?.username || "Unknown";
                            const username = conv?.isGroup ? "" : other?.username;
                            const avatar = conv?.isGroup ? null : other?.avatar;

                            return (
                                <>
                                    {avatar ? (
                                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                        <MessageCircle className="w-6 h-6 text-slate-500" />
                                    )}
                                </>
                            );
                        })()}
                    </div>
                    <div>
                        {(() => {
                            const conv = conversations.find(c => c.id === activeConversationId);
                            const other = conv?.members?.find((m: any) => m.user.username !== user?.username)?.user;
                            const name = conv?.isGroup ? conv.name : other?.name || other?.username || "Unknown";
                            const username = conv?.isGroup ? "" : other?.username;

                            return (
                                <>
                                    <h2 className="font-semibold text-lg leading-tight">{name}</h2>
                                    {username && <p className="text-xs text-muted-foreground">@{username}</p>}
                                    {!username && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-xs text-muted-foreground">{isConnected ? 'Online' : 'Disconnected'}</span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Phone className="w-5 h-5 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon"><Video className="w-5 h-5 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5 text-muted-foreground" /></Button>
                </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6 max-w-3xl mx-auto pb-4">
                    {messages.length === 0 && (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">Welcome to NhanZ Chat!</h3>
                            <p className="text-muted-foreground">This is the start of your conversation.</p>
                        </div>
                    )}

                    <AnimatePresence>
                        {messages.map((msg, idx) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden">
                                            {msg.sender?.avatar ? (
                                                <img src={msg.sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                msg.sender?.username?.[0]?.toUpperCase() || "?"
                                            )}
                                        </div>
                                        <div className={`p-3 rounded-2xl shadow-sm ${isMe
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-white border rounded-bl-sm'
                                            }`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <p className="text-[10px] opacity-70 mt-1 select-none">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Typing Indicator */}
            {activeConversationId && typingUsers[activeConversationId]?.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground italic animate-pulse">
                    {typingUsers[activeConversationId].join(", ")} is typing...
                </div>
            )}

            {/* Chat Input */}
            <div className="p-4 bg-white border-t">
                <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-3 relative">
                    <Input
                        value={inputText}
                        onChange={handleInput}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage(e);
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 min-h-[50px] pr-12 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-offset-0"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full"
                        disabled={!inputText.trim() || !isConnected}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
