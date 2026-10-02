import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";
import { useChatStore } from "@/stores/useChatStore";
import { useCallStore } from "@/stores/useCallStore";
import { encryptMessage, decryptMessage } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, Video, MoreVertical, MessageCircle, Paperclip, Smile, Copy, CornerUpLeft, Edit2, Trash, Sparkles, Pin, Lock, ChevronLeft, Search, X, Mic, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { UserProfilePanel } from "@/components/UserProfilePanel";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: Date;
    sender?: {
        id: string;
        username: string;
        avatar?: string;
    };
    reactions?: any[];
    editedAt?: string;
    deletedAt?: string;
    attachmentUrl?: string;
    attachmentType?: string;
    isPinned?: boolean;
    pinnedBy?: string;
    translatedText?: string;
    isTranslating?: boolean;
    replyTo?: {
        id: string;
        content?: string;
        text?: string;
        sender?: { id: string; username: string; avatar?: string };
    };
}

import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "@/stores/useThemeStore";

export default function ChatPage() {
    const { socket, isConnected } = useSocket();
    const { user, theme } = useAuthStore();
    const { activeConversationId, setActiveConversation, updateConversationLastMessage, typingUsers, setTyping, conversations, onlineUsers, toggleReaction, editMessage, deleteMessage, togglePinMessage } = useChatStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [otherUserReadAt, setOtherUserReadAt] = useState<Date | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [isPinnedOpen, setIsPinnedOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    

    
    // Voice Message State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Local state to track which conversation we are currently showing messages for
    // This helps avoid race conditions or flickering when switching
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { bubbleStyle, fontSize, chatDensity } = useThemeStore();



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
                
                const mappedMessages = await Promise.all(res.data.map(async (m: any) => ({
                    id: m.id,
                    text: await decryptMessage(m.content, activeConversationId),
                    senderId: m.senderId,
                    timestamp: m.createdAt,
                    sender: m.sender,
                    reactions: m.reactions,
                    editedAt: m.editedAt,
                    deletedAt: m.deletedAt,
                    attachmentUrl: m.attachmentUrl,
                    attachmentType: m.attachmentType,
                    isPinned: m.isPinned,
                    pinnedBy: m.pinnedBy,
                    replyTo: m.replyTo,
                })));
                
                setMessages(mappedMessages);

                // Fetch read receipts
                const receiptsRes = await api.get(`/api/messages/${activeConversationId}/receipts`);
                const otherUserReceipt = receiptsRes.data.find((r: any) => r.userId !== user?.id);
                if (otherUserReceipt) {
                    setOtherUserReadAt(new Date(otherUserReceipt.lastReadAt));
                } else {
                    setOtherUserReadAt(null);
                }

                // Join socket room
                if (socket) {
                    socket.emit("join_room", activeConversationId);
                }

                // Send read receipt
                api.post(`/api/messages/${activeConversationId}/read`).catch(console.error);

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

        socket.on("receive_message", async (data: any) => {
            // Ignore my own messages (handled optimistically)
            if (data.senderId === user?.id) return;

            // Decrypt message
            let decryptedText = data.text;
            if (data.conversationId) {
                decryptedText = await decryptMessage(data.text, data.conversationId);
            }

            // BUT ALWAYS update sidebar last message regardless of active chat
            if (data.conversationId) {
                updateConversationLastMessage(data.conversationId, {
                    content: decryptedText,
                    createdAt: data.timestamp
                });

                if (data.conversationId !== activeConvRef.current) {
                    useChatStore.getState().incrementUnreadCount(data.conversationId);
                }
            }

            if (data.conversationId === activeConvRef.current) {
                setMessages((prev) => [...prev, { ...data, text: decryptedText }]);
                socket.emit("mark_read", { conversationId: data.conversationId, userId: user?.id });
            }
        });

        socket.on("typing", (data: any) => {
            setTyping(data.conversationId, data.username, true);
        });

        socket.on("stop_typing", (data: any) => {
            setTyping(data.conversationId, data.username, false);
        });

        socket.on("message_reaction", (data: any) => {
            if (data.conversationId === activeConvRef.current) {
                setMessages((prev) => prev.map(m => {
                    if (m.id === data.messageId) {
                        const reactions = m.reactions || [];
                        let newReactions;
                        if (data.action === "added") {
                            newReactions = [...reactions, data.reaction];
                        } else {
                            newReactions = reactions.filter(r => r.userId !== data.userId || r.emoji !== data.emoji);
                        }
                        return { ...m, reactions: newReactions };
                    }
                    return m;
                }));
            }
        });

        socket.on("message_edited", (data: any) => {
            if (data.conversationId === activeConvRef.current) {
                setMessages((prev) => prev.map(m => m.id === data.id ? { ...m, text: data.content, editedAt: data.editedAt } : m));
            }
        });

        socket.on("message_deleted", (data: any) => {
            if (data.conversationId === activeConvRef.current) {
                setMessages((prev) => prev.map(m => m.id === data.id ? { ...m, text: data.content, deletedAt: data.deletedAt } : m));
            }
        });

        socket.on("messages_read", (data: any) => {
            if (data.conversationId === activeConvRef.current && data.userId !== user?.id) {
                setOtherUserReadAt(new Date(data.lastReadAt));
            }
        });

        socket.on("message_pinned", (data: any) => {
            if (data.conversationId === activeConvRef.current) {
                setMessages((prev) => prev.map(m => m.id === data.messageId ? { ...m, isPinned: data.isPinned, pinnedBy: data.pinnedBy } : m));
            }
        });

        return () => {
            socket.off("receive_message");
            socket.off("typing");
            socket.off("stop_typing");
            socket.off("message_reaction");
            socket.off("message_edited");
            socket.off("message_deleted");
            socket.off("messages_read");
            socket.off("message_pinned");
        };
    }, [socket, updateConversationLastMessage, setTyping]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
                    setSelectedFile(file);
                    setTimeout(() => {
                        const sendBtn = document.getElementById("send-btn-submit");
                        if (sendBtn) sendBtn.click();
                    }, 100);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            audioChunksRef.current = []; // Clear chunks so it doesn't upload
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputText.trim() && !selectedFile) || !socket || !user || !activeConversationId) return;

        let attachmentUrl = undefined;
        let attachmentType = undefined;

        if (selectedFile) {
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append("attachment", selectedFile);
                const res = await api.post("/api/messages/upload", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                });
                attachmentUrl = res.data.url;
                attachmentType = res.data.type;
            } catch (error) {
                console.error("Upload failed", error);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
            setSelectedFile(null);
        }

        const messageData = {
            text: inputText,
            senderId: user.id,
            conversationId: activeConversationId,
            timestamp: new Date(),
            ...(attachmentUrl && { attachmentUrl, attachmentType }),
            ...(replyToMessage && { replyToId: replyToMessage.id })
        };

        if (editingMessageId) {
            editMessage(editingMessageId, inputText);
            setEditingMessageId(null);
        } else {
            // Optimistic Update (Unencrypted for UI)
            setMessages((prev) => [...prev, {
                ...messageData,
                id: `temp-${Date.now()}`,
                sender: { id: user.id, username: user.username, avatar: user.avatar },
                replyTo: replyToMessage
            } as Message]);

            // Encrypt before sending over the wire
            const encryptedText = await encryptMessage(inputText, activeConversationId);
            
            socket.emit("send_message", { ...messageData, text: encryptedText });
        }
        setInputText("");
        setReplyToMessage(null);
    };



    const activeConv = conversations.find(c => c.id === activeConversationId);
    const otherUser = activeConv?.members?.find((m: any) => m.user.username !== user?.username)?.user;
    const chatName = activeConv?.isGroup ? activeConv.name : otherUser?.name || otherUser?.username || "Unknown";
    const chatAvatar = activeConv?.isGroup ? null : otherUser?.avatar;
    const isOtherUserOnline = otherUser?.id ? onlineUsers.has(otherUser.id) : false;

    const filteredMessages = isSearchOpen && searchQuery.trim()
        ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    if (!activeConversationId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-transparent text-muted-foreground relative overflow-hidden">
                {/* Ambient background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                </div>
                <div className="text-center z-10 animate-fade-slide-up">
                    <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="inline-block">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-[var(--glass-border)] glow-sm">
                            <MessageCircle className="w-12 h-12 text-primary/60" />
                        </div>
                    </motion.div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-3">Start a conversation</h2>
                    <p className="text-lg text-muted-foreground">Select a contact from the sidebar to chat</p>
                    <p className="text-sm text-muted-foreground/60 mt-2">or press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-mono">Ctrl+K</kbd> to search</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="flex-1 flex flex-col h-full bg-transparent relative"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                }
            }}
        >
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-dashed border-primary m-4 rounded-3xl animate-in fade-in pointer-events-none">
                    <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <Paperclip className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Drop file to upload</h2>
                </div>
            )}
            
            {/* Chat Header */}
            <div className="h-16 border-b border-[var(--glass-border)] glass flex items-center justify-between px-2 md:px-6 z-10">
                <div className="flex items-center gap-1 md:gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden mr-1" onClick={() => setActiveConversation("")}>
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div 
                        className="flex items-center gap-1 md:gap-3 cursor-pointer hover:bg-white/5 p-1 -ml-1 rounded-xl transition-colors"
                        onClick={() => setIsProfileOpen(true)}
                    >
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-[var(--glass-border)] shrink-0">
                            {chatAvatar ? (
                                <img src={chatAvatar} alt={chatName} className="w-full h-full object-cover" />
                            ) : (
                                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg leading-tight text-foreground flex items-center gap-2">
                                {chatName}
                                {!activeConv?.isGroup && (
                                    <span title="Messages are end-to-end encrypted" className="cursor-help flex items-center justify-center p-1 bg-green-500/20 text-green-500 rounded-full">
                                        <Lock className="w-3 h-3" />
                                    </span>
                                )}
                            </h2>
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
                </div>
                
                {/* E2EE Banner for direct messages */}
                {!activeConv?.isGroup && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[10px] px-3 py-0.5 rounded-b-lg backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <Lock className="w-2.5 h-2.5" />
                        End-to-End Encrypted
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {isSearchOpen ? (
                        <div className="flex items-center gap-2 bg-[var(--glass-input)] border border-[var(--glass-border)] rounded-full px-3 py-1 animate-in fade-in slide-in-from-right-4">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-sm w-32 md:w-48 text-foreground"
                                autoFocus
                            />
                            <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full hover:bg-white/10" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}>
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="icon" className="hover:bg-white/5" onClick={() => setIsSearchOpen(true)}>
                            <Search className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    )}
                    
                    <Sheet open={isPinnedOpen} onOpenChange={setIsPinnedOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-white/5 relative">
                                <Pin className="w-5 h-5 text-muted-foreground" />
                                {messages.filter(m => m.isPinned && !m.deletedAt).length > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]"></span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background/95 backdrop-blur-xl border-l border-[var(--glass-border)] p-0 flex flex-col" aria-describedby={undefined}>
                            <SheetHeader className="p-4 border-b border-[var(--glass-border)]">
                                <SheetTitle className="flex items-center gap-2">
                                    <Pin className="w-5 h-5 text-yellow-500" />
                                    Pinned Messages
                                </SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="flex-1 p-4">
                                {messages.filter(m => m.isPinned && !m.deletedAt).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-20">
                                        <Pin className="w-12 h-12 mb-4 opacity-20" />
                                        <p>No pinned messages yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.filter(m => m.isPinned && !m.deletedAt).reverse().map(msg => (
                                            <div key={msg.id} className="bg-[var(--glass-input)] border border-[var(--glass-border)] rounded-xl p-3 cursor-pointer hover:bg-[var(--glass-hover)] transition-colors" onClick={() => {
                                                setIsPinnedOpen(false);
                                                const el = document.getElementById(`msg-${msg.id}`);
                                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }}>
                                                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                                    <span className="font-medium text-foreground">{msg.sender?.username || "Someone"}</span>
                                                    <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm line-clamp-3 text-foreground">{msg.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>

                    <Button variant="ghost" size="icon" className="hover:bg-white/5" onClick={() => {
                        if (socket && otherUser) {
                            socket.emit("call_initiate", { targetUserId: otherUser.id, callerId: user?.id, callerName: user?.name || user?.username, isVideo: false });
                            useCallStore.getState().setCallData(otherUser.id, otherUser.name || otherUser.username, false);
                            useCallStore.getState().setCallStatus('calling');
                        }
                    }}>
                        <Phone className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5" onClick={() => {
                        if (socket && otherUser) {
                            socket.emit("call_initiate", { targetUserId: otherUser.id, callerId: user?.id, callerName: user?.name || user?.username, isVideo: true });
                            useCallStore.getState().setCallData(otherUser.id, otherUser.name || otherUser.username, true);
                            useCallStore.getState().setCallStatus('calling');
                        }
                    }}>
                        <Video className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5" onClick={() => setIsProfileOpen(true)}>
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className={`${chatDensity === 'compact' ? 'space-y-2' : chatDensity === 'spacious' ? 'space-y-6' : 'space-y-4'} max-w-6xl mx-auto w-full pb-4 pt-4 px-2 md:px-6`}>
                    {isMessagesLoading ? (
                        <div className="space-y-6">
                            {[...Array(4)].map((_, i) => {
                                const isMe = i % 2 !== 0;
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0"></div>
                                            <div className={`h-12 w-48 rounded-2xl skeleton-shimmer ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}></div>
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
                        {filteredMessages.map((msg, idx) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <motion.div
                                    key={msg.id || idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <ContextMenu>
                                        <ContextMenuTrigger className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                            {!isMe && (
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-black/20 flex-shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden border border-white/5">
                                                        {msg.sender?.avatar ? (
                                                            <img src={msg.sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            msg.sender?.username?.[0]?.toUpperCase() || "?"
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-1">
                                                {msg.replyTo && !msg.deletedAt && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[var(--glass-input)] border border-[var(--glass-border)] rounded-lg p-2 mb-1 cursor-pointer hover:bg-[var(--glass-hover)] transition-colors"
                                                         onClick={() => {
                                                             const el = document.getElementById(`msg-${msg.replyTo!.id}`);
                                                             if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                         }}>
                                                        <CornerUpLeft className="w-3 h-3" />
                                                        <span className="font-semibold">{msg.replyTo.sender?.username || "Someone"}</span>
                                                        <span className="truncate max-w-[150px]">{msg.replyTo.text || "Attachment"}</span>
                                                    </div>
                                                )}
                                                <div id={`msg-${msg.id}`} className={`p-3 ${bubbleStyle === 'sharp' ? 'rounded-md' : bubbleStyle === 'cloud' ? 'rounded-[2rem]' : 'rounded-2xl'} ${
                                                    msg.deletedAt ? 'bg-[var(--glass-input)] border border-[var(--glass-border)] rounded-bl-sm text-muted-foreground italic' 
                                                    : isMe ? 'bg-gradient-to-r from-primary to-[color-mix(in_srgb,var(--primary),#000_20%)] text-primary-foreground rounded-br-sm shadow-[0_4px_15px_rgba(14,165,233,0.2)] border-0'
                                                    : 'glass border border-[var(--glass-border)] rounded-bl-sm text-foreground'
                                                    }`}>
                                                    {!msg.deletedAt && msg.attachmentUrl && (
                                                        msg.attachmentType === "image" ? (
                                                            <div className="mb-2 rounded-lg overflow-hidden border border-[var(--glass-border)]">
                                                                <img src={msg.attachmentUrl} alt="attachment" className="max-w-full h-auto max-h-[300px] object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => setLightboxMedia({url: msg.attachmentUrl!, type: 'image'})} />
                                                            </div>
                                                        ) : msg.attachmentType === "video" ? (
                                                            <div className="mb-2 rounded-lg overflow-hidden border border-white/10 relative group cursor-pointer" onClick={(e) => {
                                                                if ((e.target as HTMLElement).tagName !== 'VIDEO') setLightboxMedia({url: msg.attachmentUrl!, type: 'video'});
                                                            }}>
                                                                <video src={msg.attachmentUrl} controls className="max-w-full max-h-[300px]" />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                    <div className="bg-black/60 rounded-full p-2 backdrop-blur-sm">
                                                                        <Search className="w-6 h-6 text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : msg.attachmentType === "audio" ? (
                                                            <div className="mb-2 p-2 rounded-lg bg-[var(--glass-input)] border border-[var(--glass-border)] flex items-center gap-3">
                                                                <Mic className="w-5 h-5 text-primary shrink-0" />
                                                                <audio src={msg.attachmentUrl} controls className="h-8 max-w-[200px]" />
                                                            </div>
                                                        ) : (
                                                            <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-[var(--glass-input)] hover:bg-[var(--glass-hover)] transition-colors border border-[var(--glass-border)] text-sm">
                                                                <Paperclip className="w-4 h-4" />
                                                                <span className="underline truncate max-w-[200px]">Download File</span>
                                                            </a>
                                                        )
                                                    )}
                                                    <div className={`${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'} leading-relaxed whitespace-pre-wrap max-w-none [&_p]:my-0 [&_pre]:my-1 [&_pre]:bg-black/30 [&_pre]:p-2 [&_pre]:rounded-md [&_code]:bg-black/30 [&_code]:rounded-sm [&_code]:px-1 [&_a]:text-blue-300 [&_a]:underline`}>
                                                        {msg.deletedAt ? (
                                                            "This message was deleted"
                                                        ) : (
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        )}
                                                    </div>

                                                    <div className={`flex items-center gap-1 text-[10px] mt-1 select-none ${msg.deletedAt ? 'opacity-50' : isMe ? 'opacity-80 text-white/80' : 'text-muted-foreground'}`}>
                                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {msg.editedAt && !msg.deletedAt && <span>(edited)</span>}
                                                        {isMe && !msg.deletedAt && (
                                                            <span className="ml-1 text-[12px] font-bold">
                                                                {otherUserReadAt && new Date(msg.timestamp) <= otherUserReadAt ? (
                                                                    <span className="text-blue-300">✓✓</span>
                                                                ) : msg.id.startsWith("temp-") ? (
                                                                    <span>✓</span>
                                                                ) : (
                                                                    <span>✓✓</span>
                                                                )}
                                                            </span>
                                                        )}
                                                        {msg.isPinned && !msg.deletedAt && (
                                                            <span className="text-yellow-400 ml-1 flex items-center" title="Pinned">
                                                                <Pin className="w-2.5 h-2.5 inline" fill="currentColor" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Reactions */}
                                                {!msg.deletedAt && msg.reactions && msg.reactions.length > 0 && (
                                                    <div className={`flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                                                            const count = msg.reactions!.filter(r => r.emoji === emoji).length;
                                                            const iReacted = msg.reactions!.some(r => r.emoji === emoji && r.userId === user?.id);
                                                            return (
                                                                <div 
                                                                    key={emoji} 
                                                                    onClick={() => msg.id && toggleReaction(msg.id, emoji)}
                                                                    className={`px-1.5 py-0.5 rounded-full text-xs cursor-pointer flex items-center gap-1 border transition-colors ${iReacted ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-[var(--glass-input)] border-[var(--glass-border)] hover:bg-[var(--glass-hover)]'}`}
                                                                >
                                                                    <span>{emoji}</span>
                                                                    <span className="text-[10px] opacity-80">{count}</span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48 bg-background/95 backdrop-blur-md border-white/10">
                                            {!msg.deletedAt && (
                                                <>
                                                    <ContextMenuItem className="cursor-pointer flex items-center gap-2" onClick={() => navigator.clipboard.writeText(msg.text)}>
                                                        <Copy className="w-4 h-4" /> Copy text
                                                    </ContextMenuItem>
                                                    <ContextMenuItem className="cursor-pointer flex items-center gap-2" onClick={() => setReplyToMessage(msg as Message)}>
                                                        <CornerUpLeft className="w-4 h-4" /> Reply
                                                    </ContextMenuItem>

                                                    <ContextMenuItem className="cursor-pointer flex items-center gap-2" onClick={() => msg.id && togglePinMessage(msg.id)}>
                                                        <Pin className="w-4 h-4" /> {msg.isPinned ? "Unpin" : "Pin"}
                                                    </ContextMenuItem>
                                                    
                                                    <ContextMenuSeparator className="bg-white/10" />
                                                    
                                                    <div className="flex items-center justify-between px-2 py-1.5">
                                                        {["👍", "❤️", "😂", "🔥", "😢", "👏"].map(emoji => (
                                                            <div 
                                                                key={emoji}
                                                                onClick={() => msg.id && toggleReaction(msg.id, emoji)}
                                                                className="cursor-pointer hover:scale-125 transition-transform text-lg"
                                                            >
                                                                {emoji}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {isMe && (
                                                        <>
                                                            <ContextMenuSeparator className="bg-white/10" />
                                                            <ContextMenuItem 
                                                                className="cursor-pointer flex items-center gap-2" 
                                                                onClick={() => {
                                                                    if (msg.id) {
                                                                        setEditingMessageId(msg.id);
                                                                        setInputText(msg.text);
                                                                    }
                                                                }}
                                                            >
                                                                <Edit2 className="w-4 h-4" /> Edit
                                                            </ContextMenuItem>
                                                            <ContextMenuItem className="cursor-pointer flex items-center gap-2 text-red-500 focus:text-red-500" onClick={() => msg.id && deleteMessage(msg.id)}>
                                                                <Trash className="w-4 h-4" /> Delete
                                                            </ContextMenuItem>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </ContextMenuContent>
                                    </ContextMenu>
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
                <form onSubmit={sendMessage} className="max-w-6xl mx-auto w-full flex flex-col gap-2 relative px-2 md:px-6">

                    {editingMessageId && (
                        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-t-xl -mb-4 pb-5 z-0 text-xs text-primary">
                            <span className="flex items-center gap-1.5"><Edit2 className="w-3 h-3" /> Editing message</span>
                            <button type="button" onClick={() => { setEditingMessageId(null); setInputText(""); }} className="hover:text-primary/70 underline cursor-pointer">Cancel</button>
                        </div>
                    )}
                    {replyToMessage && (
                        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-4 py-2 rounded-t-xl -mb-4 pb-5 z-0 text-xs text-primary">
                            <span className="flex items-center gap-1.5 truncate"><CornerUpLeft className="w-3 h-3" /> Replying to <span className="font-semibold">{replyToMessage.sender?.username}</span>: {replyToMessage.text || "Attachment"}</span>
                            <button type="button" onClick={() => setReplyToMessage(null)} className="hover:text-primary/70 underline cursor-pointer">Cancel</button>
                        </div>
                    )}
                    {selectedFile && (
                        <div className="flex items-center justify-between bg-white/5 border border-white/10 px-4 py-2 rounded-xl mb-1 text-sm text-foreground">
                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                            <button type="button" onClick={() => setSelectedFile(null)} className="hover:text-red-400">
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2 items-end z-10 relative">

                        <div className="relative flex-1 flex items-center">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                        <Button type="button" onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" className="absolute left-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full z-10 w-9 h-9">
                            <Paperclip className="w-4 h-4" />
                        </Button>
                        {isRecording ? (
                            <div className="w-full min-h-[50px] flex items-center justify-between pl-6 pr-4 rounded-3xl glass border border-red-500/50 bg-red-500/10">
                                <div className="flex items-center gap-3 text-red-500 font-medium">
                                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                    Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                </div>
                                <div className="flex items-center gap-2 z-20">
                                    <Button type="button" variant="ghost" size="icon" className="hover:bg-red-500/20 text-red-400" onClick={cancelRecording}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" className="hover:bg-red-500/20 text-red-400" onClick={stopRecording}>
                                        <Square className="w-4 h-4 fill-current" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Input
                                ref={inputRef}
                                value={inputText}
                                onChange={handleInput}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e);
                                    }
                                }}
                                placeholder="Type a message..."
                                className="w-full min-h-[50px] pl-12 pr-12 rounded-3xl glass border-[var(--glass-border)] focus-visible:ring-1 focus-visible:ring-primary/50 text-foreground"
                            />
                        )}
                        {!isRecording && (
                            <div className="absolute right-1.5 z-20">
                                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full w-9 h-9">
                                            <Smile className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent side="top" align="end" className="w-auto p-0 border-none bg-transparent shadow-none mb-2 z-50">
                                        <EmojiPicker
                                            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                                            onEmojiClick={(emojiData) => {
                                                setInputText(prev => prev + emojiData.emoji);
                                                inputRef.current?.focus();
                                            }}
                                            style={{ backgroundColor: 'var(--glass-input)', borderColor: 'var(--glass-border)', '--epr-bg-color': 'rgba(0,0,0,0.5)', '--epr-category-label-bg-color': 'rgba(0,0,0,0.8)' } as any}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>
                        {(!inputText.trim() && !selectedFile && !isRecording) ? (
                            <Button
                                type="button"
                                size="icon"
                                className="h-[50px] w-[50px] rounded-full bg-[var(--glass-input)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] transition-all shrink-0 text-foreground"
                                onClick={startRecording}
                            >
                                <Mic className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button
                                id="send-btn-submit"
                                type="submit"
                                size="icon"
                                className="h-[50px] w-[50px] rounded-full bg-gradient-to-tr from-primary to-accent border-0 hover:opacity-90 hover:scale-105 transition-all glow-sm shrink-0"
                                disabled={(!inputText.trim() && !selectedFile) || !isConnected || isUploading}
                            >
                                {isUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editingMessageId ? <Edit2 className="w-5 h-5 text-white" /> : <Send className="w-5 h-5 text-white ml-0.5" />}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
            {/* Media Lightbox */}
            <AnimatePresence>
                {lightboxMedia && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center"
                        onClick={() => setLightboxMedia(null)}
                    >
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-4 right-4 text-white hover:bg-white/10 z-50 rounded-full"
                            onClick={() => setLightboxMedia(null)}
                        >
                            <X className="w-8 h-8" />
                        </Button>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-[90vw] max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {lightboxMedia.type === 'image' ? (
                                <img src={lightboxMedia.url} alt="Expanded Media" className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" />
                            ) : (
                                <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" />
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <UserProfilePanel 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
                user={otherUser || null}
                isGroup={activeConv?.isGroup}
                conversation={activeConv}
            />
        </div>
    );
}
