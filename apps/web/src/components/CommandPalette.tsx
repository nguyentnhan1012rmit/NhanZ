import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, User, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { conversations, users, setActiveConversation, fetchConversations } = useChatStore();
    const { user } = useAuthStore();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()) || u.name?.toLowerCase().includes(query.toLowerCase()));
    
    const filteredConversations = conversations.filter(c => {
        const otherMember = c.members?.find((m: any) => m.user.username !== user?.username)?.user;
        const name = c.isGroup ? c.name : (otherMember?.name || otherMember?.username || "Unknown");
        return name?.toLowerCase().includes(query.toLowerCase());
    });

    const handleSelectUser = async (selectedUser: any) => {
        setOpen(false);
        // Find existing conversation
        const existingConv = conversations.find(c => !c.isGroup && c.members?.some((m: any) => m.user.id === selectedUser.id));
        if (existingConv) {
            setActiveConversation(existingConv.id);
        } else {
            try {
                const res = await api.post('/api/app', { targetUserId: selectedUser.id });
                await fetchConversations();
                setActiveConversation(res.data.id);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSelectConversation = (convId: string) => {
        setOpen(false);
        setActiveConversation(convId);
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[550px] p-0 glass border-white/10 gap-0 overflow-hidden shadow-2xl">
                <div className="flex items-center border-b border-white/10 px-4 py-3">
                    <Search className="w-5 h-5 text-muted-foreground mr-3" />
                    <Input 
                        autoFocus
                        placeholder="Search conversations, users... (Cmd+K)" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border-0 focus-visible:ring-0 bg-transparent text-base shadow-none px-0"
                    />
                </div>
                
                <ScrollArea className="max-h-[350px]">
                    {query.length > 0 ? (
                        <div className="p-2 space-y-4">
                            {filteredConversations.length > 0 && (
                                <div>
                                    <h4 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversations</h4>
                                    <div className="space-y-1">
                                        {filteredConversations.map(conv => {
                                            const otherMember = conv.members?.find((m: any) => m.user.username !== user?.username)?.user;
                                            const name = conv.isGroup ? conv.name : (otherMember?.name || otherMember?.username || "Unknown");
                                            return (
                                                <div 
                                                    key={conv.id} 
                                                    onClick={() => handleSelectConversation(conv.id)}
                                                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-white/10 cursor-pointer transition-colors"
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-3 text-primary" />
                                                    {name}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {filteredUsers.length > 0 && (
                                <div>
                                    <h4 className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</h4>
                                    <div className="space-y-1">
                                        {filteredUsers.map(u => (
                                            <div 
                                                key={u.id} 
                                                onClick={() => handleSelectUser(u)}
                                                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-white/10 cursor-pointer transition-colors"
                                            >
                                                <User className="w-4 h-4 mr-3 text-primary" />
                                                <div className="flex flex-col">
                                                    <span>{u.name || u.username}</span>
                                                    <span className="text-[10px] text-muted-foreground">@{u.username}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredConversations.length === 0 && filteredUsers.length === 0 && (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    No results found for "{query}"
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground py-10">
                            Type to start searching...
                        </div>
                    )}
                </ScrollArea>
                <div className="px-4 py-2 border-t border-white/5 bg-black/10 text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>Use <kbd className="bg-white/10 px-1 rounded">↑</kbd> <kbd className="bg-white/10 px-1 rounded">↓</kbd> to navigate</span>
                    <span><kbd className="bg-white/10 px-1 rounded">esc</kbd> to close</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
