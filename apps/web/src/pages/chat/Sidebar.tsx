import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/useAuthStore";
import { LogOut, Search, User, SquarePen, Lock, Shield, Moon, Sun, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SettingsModal } from "@/components/SettingsModal";
import { PrivacyModal } from "@/components/PrivacyModal";
import { SecurityModal } from "@/components/SecurityModal";
import { AppearanceModal } from "@/components/AppearanceModal";
import { NewChatModal } from "@/components/NewChatModal";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";

export function Sidebar() {
    const { user, logout, status, theme, toggleTheme } = useAuthStore();
    const { conversations, fetchUsers, fetchConversations, activeConversationId, setActiveConversation, isLoading, onlineUsers, unreadCounts } = useChatStore();

    // Modal states
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [securityOpen, setSecurityOpen] = useState(false);
    const [appearanceOpen, setAppearanceOpen] = useState(false);
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = conversations.filter(c => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        if (c.isGroup && c.name?.toLowerCase().includes(query)) return true;
        
        const otherMember = c.members?.find((m: any) => m.user.username !== user?.username)?.user;
        const name = otherMember?.name || otherMember?.username || "Unknown";
        return name.toLowerCase().includes(query);
    });

    useEffect(() => {
        fetchUsers();
        fetchConversations();
    }, []);

    return (
        <div className="w-[340px] border-r border-white/5 bg-background/60 backdrop-blur-2xl flex flex-col h-full z-10 shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity p-1 rounded-md -ml-1">
                            <div className="relative group">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-xs">{user?.username?.[0]?.toUpperCase() || "U"}</span>
                                        )}
                                    </div>
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${status === 'dnd' ? 'bg-yellow-500' :
                                    status === 'invisible' ? 'bg-red-500' :
                                        'bg-green-500'
                                    }`}></div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="font-semibold text-sm leading-none">{user?.name || user?.username}</p>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>@{user?.username}</DropdownMenuLabel>
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
                        <DropdownMenuItem onSelect={() => setAppearanceOpen(true)} className="cursor-pointer">
                            <Sun className="w-4 h-4 mr-2" />
                            Appearance
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

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Theme" className="hover:bg-primary/20 hover:text-primary transition-colors">
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setNewChatOpen(true)} title="New Chat" className="hover:bg-primary/20 hover:text-primary transition-colors hover:shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                        <SquarePen className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search chats..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 bg-black/20 border-white/10 focus-visible:ring-primary/50 transition-all glass" 
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 pt-0 space-y-4">
                    {/* Conversations List */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Recent Chats
                        </p>
                        {isLoading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
                                        <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"></div>
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-white/10 rounded w-1/2"></div>
                                            <div className="h-3 bg-white/10 rounded w-3/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                {searchQuery ? "No chats found." : "No conversations yet.\nStart a new chat!"}
                            </div>
                        ) : (
                            filteredConversations.map(c => {
                                // Find name of other person
                                const otherMember = c.members?.find((m: any) => m.user.username !== user?.username)?.user;
                                const name = c.isGroup ? c.name : otherMember?.name || otherMember?.username || "Unknown";
                                const isActive = c.id === activeConversationId;
                                const avatar = c.isGroup ? null : otherMember?.avatar;

                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setActiveConversation(c.id)}
                                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border-l-[3px] ${isActive ? 'bg-gradient-to-r from-primary/15 to-transparent border-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'border-transparent hover:bg-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-black/20 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                                {avatar ? (
                                                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            {!c.isGroup && otherMember?.id && onlineUsers.has(otherMember.id) && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
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
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground truncate pr-2">
                                                    {c.messages?.[0]?.content || "Start a conversation"}
                                                </p>
                                                {unreadCounts[c.id] ? (
                                                    <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 min-w-4 h-4 flex items-center justify-center rounded-full shrink-0">
                                                        {unreadCounts[c.id]}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </ScrollArea>



            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
            <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
            <SecurityModal open={securityOpen} onOpenChange={setSecurityOpen} />
            <AppearanceModal open={appearanceOpen} onOpenChange={setAppearanceOpen} />
            <NewChatModal open={newChatOpen} onOpenChange={setNewChatOpen} />
        </div>
    );
}
