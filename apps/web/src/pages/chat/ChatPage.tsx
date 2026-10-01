import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, Video, MoreVertical, MessageCircle, Paperclip, Smile } from "lucide-react";
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
    const { activeConversationId, updateConversationLastMessage, typingUsers, setTyping, conversations, onlineUsers } = useChatStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);

    // Local state to track which conversation we are currently showing messages for
    // This helps avoid race conditions or flickering when switching
    const [currentConvId, setCurrentConvId] = useState<string | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const activeConvRef = useRef<string | null>(activeConversationId);

    useEffect(() => {
        activeConvRef.current = activeConversationId;
    }, [activeConversationId]);

    // Fetch messages when activeConversationId changes
    useEffect(() => {
        if (!activeConversationId) return;

        // Reset text when switching chats (optional, but good UX)
        setInputText("");

        const loadMessages = async () => {
            setIsMessagesLoading(true);
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
            } finally {
                setIsMessagesLoading(false);
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

            // BUT ALWAYS update sidebar last message regardless of active chat
            // We need conversationId in data
            if (data.conversationId) {
                updateConversationLastMessage(data.conversationId, {
                    content: data.text,
                    createdAt: data.timestamp
                });

                if (data.conversationId !== activeConvRef.current) {
                    useChatStore.getState().incrementUnreadCount(data.conversationId);
                }
            }

            if (data.conversationId === activeConvRef.current) {
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

    const activeConv = conversations.find(c => c.id === activeConversationId);
    const otherUser = activeConv?.members?.find((m: any) => m.user.username !== user?.username)?.user;
    const chatName = activeConv?.isGroup ? activeConv.name : otherUser?.name || otherUser?.username || "Unknown";
    const chatAvatar = activeConv?.isGroup ? null : otherUser?.avatar;
    const isOtherUserOnline = otherUser?.id ? onlineUsers.has(otherUser.id) : false;

    if (!activeConversationId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-transparent text-muted-foreground relative overflow-hidden">
                <div className="text-center z-10">
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="inline-block">
                        <MessageCircle className="w-20 h-20 mx-auto mb-6 text-primary/40 drop-shadow-[0_0_15px_rgba(14,165,233,0.4)]" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-3">Start a conversation</h2>
                    <p className="text-lg">Select a contact from the sidebar to chat.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent relative">
            {/* Chat Header */}
            <div className="h-16 border-b border-white/5 glass flex items-center justify-between px-6 z-10 backdrop-blur-xl bg-background/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center overflow-hidden border border-white/5">
                        {chatAvatar ? (
                            <img src={chatAvatar} alt={chatName} className="w-full h-full object-cover" />
                        ) : (
                            <MessageCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg leading-tight text-foreground">{chatName}</h2>
                        {!activeConv?.isGroup ? (
                            <p className="text-xs flex items-center gap-1.5 mt-0.5">
                                <span className={`w-2 h-2 rounded-full ${isOtherUserOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-500'}`} />
                                <span className="text-muted-foreground">{isOtherUserOnline ? 'Online' : 'Offline'}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground">{activeConv.members?.length} members</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-white/5"><Phone className="w-5 h-5 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5"><Video className="w-5 h-5 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5"><MoreVertical className="w-5 h-5 text-muted-foreground" /></Button>
                </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6 max-w-3xl mx-auto pb-4 pt-4">
                    {isMessagesLoading ? (
                        <div className="space-y-6">
                            {[...Array(4)].map((_, i) => {
                                const isMe = i % 2 !== 0;
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0"></div>
                                            <div className={`h-12 w-48 rounded-2xl animate-pulse ${isMe ? 'bg-primary/20 rounded-br-sm' : 'bg-white/5 rounded-bl-sm'}`}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : messages.length === 0 && (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <MessageCircle className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">Welcome to NhanZ Chat!</h3>
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
                                        <div className="w-8 h-8 rounded-full bg-black/20 flex-shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden border border-white/5">
                                            {msg.sender?.avatar ? (
                                                <img src={msg.sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                msg.sender?.username?.[0]?.toUpperCase() || "?"
                                            )}
                                        </div>
                                        <div className={`p-3 rounded-2xl ${isMe
                                            ? 'bg-gradient-to-r from-primary to-[#0284c7] text-white rounded-br-sm shadow-[0_4px_15px_rgba(14,165,233,0.2)] border-0'
                                            : 'glass border border-white/10 rounded-bl-sm text-foreground'
                                            }`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            <p className={`text-[10px] mt-1 select-none ${isMe ? 'opacity-80 text-white/80' : 'text-muted-foreground'}`}>
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
            <AnimatePresence>
                {(() => {
                    const typers = activeConversationId ? (typingUsers[activeConversationId] || []).filter(u => u !== user?.username) : [];
                    if (typers.length === 0) return null;
                    
                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-24 left-8 z-20 flex items-center gap-3 bg-background/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl"
                        >
                            <div className="flex space-x-1.5 py-1">
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.span>
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.span>
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.span>
                            </div>
                            <span className="text-[11px] text-primary font-medium tracking-wide">
                                {typers.length === 1 
                                    ? <span className="text-foreground font-semibold">{typers[0]}</span> 
                                    : typers.length === 2 
                                        ? <><span className="text-foreground font-semibold">{typers[0]}</span> and <span className="text-foreground font-semibold">{typers[1]}</span></>
                                        : <span className="text-foreground font-semibold">Multiple people</span>}
                                {" "} {typers.length > 1 ? "are typing..." : "is typing..."}
                            </span>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* Chat Input */}
            <div className="p-4 relative z-10 mt-auto">
                <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2 relative items-end">
                    <div className="relative flex-1 flex items-center">
                        <Button type="button" variant="ghost" size="icon" className="absolute left-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full z-10 w-9 h-9">
                            <Paperclip className="w-4 h-4" />
                        </Button>
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
                            className="w-full min-h-[50px] pl-12 pr-12 rounded-3xl glass bg-black/20 border-white/10 focus-visible:ring-1 focus-visible:ring-primary/50 text-foreground"
                        />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full z-10 w-9 h-9">
                            <Smile className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        className="h-[50px] w-[50px] rounded-full bg-gradient-to-tr from-primary to-accent border-0 hover:opacity-90 hover:scale-105 transition-all shadow-[0_0_10px_rgba(14,165,233,0.4)] shrink-0"
                        disabled={!inputText.trim() || !isConnected}
                    >
                        <Send className="w-5 h-5 text-white ml-0.5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
