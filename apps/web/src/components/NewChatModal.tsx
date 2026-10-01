import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface NewChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewChatModal({ open, onOpenChange }: NewChatModalProps) {
    const { users, fetchUsers, startConversation, createGroup, isLoading } = useChatStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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

    const handleCreateGroup = async () => {
        if (!groupName || selectedUsers.length === 0) return;
        await createGroup(groupName, selectedUsers);
        onOpenChange(false);
        setGroupName("");
        setSelectedUsers([]);
    };

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden glass border-white/5 text-foreground">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle>New Chat</DialogTitle>
                    <DialogDescription>Search for a user to start a conversation.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="dm" className="w-full h-full flex flex-col overflow-hidden">
                    <div className="px-4 pb-2">
                        <TabsList className="w-full grid grid-cols-2 bg-black/20 border border-white/5">
                            <TabsTrigger value="dm">Direct Message</TabsTrigger>
                            <TabsTrigger value="group">New Group</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="dm" className="flex-1 overflow-hidden m-0 flex flex-col outline-none">
                        <div className="px-4 pb-4 pt-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or username..."
                                    className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary/50 text-foreground glass"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-2 pt-0">
                                    {isLoading ? (
                                        <div className="grid gap-1">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 bg-white/10 rounded w-1/3"></div>
                                                        <div className="h-3 bg-white/10 rounded w-1/4"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : filteredUsers.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No users found.
                                        </div>
                                    ) : (
                                        <div className="grid gap-1">
                                            {filteredUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/20 transition-colors cursor-pointer group"
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
                    </TabsContent>

                    <TabsContent value="group" className="flex-1 overflow-hidden m-0 flex flex-col outline-none">
                        <div className="px-4 pb-2 pt-2 space-y-3">
                            <Input
                                placeholder="Group Name..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="bg-black/20 border-white/10 focus-visible:ring-primary/50 text-foreground glass"
                            />
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users to add..."
                                    className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary/50 text-foreground glass"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-2">
                                    <div className="grid gap-1">
                                        {filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                                                onClick={() => toggleUser(user.id)}
                                            >
                                                <Checkbox checked={selectedUsers.includes(user.id)} className="border-white/20 data-[state=checked]:bg-primary" />
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
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                        <div className="p-4 border-t border-white/5 bg-black/10 shrink-0">
                            <Button 
                                onClick={handleCreateGroup} 
                                disabled={!groupName || selectedUsers.length === 0} 
                                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity border-none"
                            >
                                Create Group {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
