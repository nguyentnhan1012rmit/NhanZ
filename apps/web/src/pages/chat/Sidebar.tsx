import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/useAuthStore";
import { LogOut, Plus, Search, User, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useEffect } from "react";

export function Sidebar() {
    const { user, logout } = useAuthStore();
    const { users, conversations, fetchUsers, fetchConversations, startConversation, activeConversationId, setActiveConversation } = useChatStore();

    useEffect(() => {
        fetchUsers();
        fetchConversations();
    }, []);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("avatar", file);

        try {
            // We need to update api.ts to allow FormData or just let axios handle it
            // Ideally should move this to a store action but for speed doing it here
            const user = useAuthStore.getState().user;
            if (!user) return;

            const res = await fetch("http://localhost:4000/api/app/users/avatar", {
                method: "POST",
                headers: {
                    'x-user-id': user.id
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                // Update local user state
                // We need an action in useAuthStore to update user partial
                useAuthStore.setState(state => ({
                    user: state.user ? { ...state.user, avatar: data.avatar } : null
                }));
                alert("Avatar updated!");
            } else {
                alert("Failed to upload: " + data.error);
            }

        } catch (error) {
            console.error("Upload error", error);
            alert("Upload failed");
        }
    };

    return (
        <div className="w-80 border-r bg-muted/20 flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative group cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.username?.[0]?.toUpperCase() || "U"
                            )}
                        </div>
                        {/* Hover overlay for upload */}
                        <div
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                            <span className="text-[8px] text-white">Edit</span>
                        </div>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{user?.username}</p>
                        <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                    logout();
                    window.location.reload();
                }}>
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search people..." className="pl-8" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 pt-0 space-y-4">
                    {/* Users List (Contacts) */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Contacts
                        </p>
                        {users.map(u => (
                            <div
                                key={u.id}
                                onClick={() => startConversation(u.id)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-sm">
                                    {u.username[0]?.toUpperCase()}
                                </div>
                                <span className="font-medium text-sm">{u.username}</span>
                            </div>
                        ))}
                    </div>

                    {/* Conversations List */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Recent Chats
                        </p>
                        {conversations.map(c => {
                            // Find name of other person
                            const otherMember = c.members?.find((m: any) => m.user.username !== user?.username)?.user;
                            const name = c.isGroup ? c.name : otherMember?.username || "Unknown";
                            const isActive = c.id === activeConversationId;

                            return (
                                <div
                                    key={c.id}
                                    onClick={() => setActiveConversation(c.id)}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-muted' : 'hover:bg-muted'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                        <User className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{name}</span>
                                            {c.messages?.[0]?.createdAt && (
                                                <span className="text-xs text-muted-foreground">
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
                        })}
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t mt-auto">
                <Button className="w-full gap-2" variant="outline">
                    <Plus className="w-4 h-4" /> New Conversation
                </Button>
            </div>
        </div>
    );
}
