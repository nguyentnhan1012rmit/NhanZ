import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/useAuthStore";
import { LogOut, Search, User, SquarePen, Lock, Shield } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SettingsModal } from "@/components/SettingsModal";
import { PrivacyModal } from "@/components/PrivacyModal";
import { SecurityModal } from "@/components/SecurityModal";
import { NewChatModal } from "@/components/NewChatModal";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";

export function Sidebar() {
    const { user, logout } = useAuthStore();
    const { conversations, fetchUsers, fetchConversations, activeConversationId, setActiveConversation } = useChatStore();

    // Modal states
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [securityOpen, setSecurityOpen] = useState(false);
    const [newChatOpen, setNewChatOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchConversations();
    }, []);

    return (
        <div className="w-80 border-r bg-muted/20 flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity p-1 rounded-md -ml-1">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold overflow-hidden ring-2 ring-transparent group-hover:ring-border transition-all">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.username?.[0]?.toUpperCase() || "U"
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
                            </div>
                            <div className="flex flex-col">
                                <p className="font-semibold text-sm leading-none">{user?.username}</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Online</p>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setSettingsOpen(true)} className="cursor-pointer">
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setPrivacyOpen(true)} className="cursor-pointer">
                            <Lock className="w-4 h-4 mr-2" />
                            Privacy
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setSecurityOpen(true)} className="cursor-pointer">
                            <Shield className="w-4 h-4 mr-2" />
                            Security
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer" onSelect={() => {
                            logout();
                            window.location.reload();
                        }}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={() => setNewChatOpen(true)} title="New Chat">
                    <SquarePen className="w-5 h-5" />
                </Button>
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-8" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 pt-0 space-y-4">
                    {/* Conversations List */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Recent Chats
                        </p>
                        {conversations.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No conversations yet.
                                <br />
                                Start a new chat!
                            </div>
                        ) : (
                            conversations.map(c => {
                                // Find name of other person
                                const otherMember = c.members?.find((m: any) => m.user.username !== user?.username)?.user;
                                const name = c.isGroup ? c.name : otherMember?.username || "Unknown";
                                const isActive = c.id === activeConversationId;
                                const avatar = c.isGroup ? null : otherMember?.avatar;

                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setActiveConversation(c.id)}
                                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-muted' : 'hover:bg-muted'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                            {avatar ? (
                                                <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="h-5 w-5 text-slate-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium truncate">{name}</span>
                                                {c.messages?.[0]?.createdAt && (
                                                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                                                        {new Date(c.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {c.messages?.[0]?.content || "Start a conversation"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Keeping the Create Group button or maybe removing it if New Chat covers it? 
                The user didn't explicitly ask to remove the bottom button, but "New Chat" button usually handles 1-1. 
                The prompt says "add friend", "new chat will be the icon...". 
                I'll keep the bottom button but rename it to "New Group" maybe? 
                Actually the original code had "New Conversation" button at bottom.
                I'll leave it as is or maybe remove it if it's redundant.
                The prompt implies the top icon is THE new chat button.
                I will comment it out or remove it to reduce clutter if the top one works proficiently 
                but let's keep it as a "Create Group" specific action later. 
                For now, I'll remove it to be clean as per user request for "New chat will be the icon...".
            */}

            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
            <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
            <SecurityModal open={securityOpen} onOpenChange={setSecurityOpen} />
            <NewChatModal open={newChatOpen} onOpenChange={setNewChatOpen} />
        </div>
    );
}
