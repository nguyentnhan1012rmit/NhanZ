import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";

interface NewChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewChatModal({ open, onOpenChange }: NewChatModalProps) {
    const { users, fetchUsers, startConversation } = useChatStore();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open, fetchUsers]);

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleStartChat = async (userId: string) => {
        await startConversation(userId);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle>New Chat</DialogTitle>
                    <DialogDescription>Search for a user to start a conversation.</DialogDescription>
                </DialogHeader>

                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or username..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-2 pt-0">
                            {filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No users found.
                                </div>
                            ) : (
                                <div className="grid gap-1">
                                    {filteredUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                                            onClick={() => handleStartChat(user.id)}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden shrink-0">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    user.username[0]?.toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{user.username}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email || "No status"}</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
