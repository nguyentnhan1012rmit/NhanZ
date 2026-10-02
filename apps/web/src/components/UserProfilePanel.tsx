import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Calendar, Phone, MapPin, Image as ImageIcon, Link as LinkIcon, FileText, UserMinus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface UserProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        username: string;
        name?: string;
        avatar?: string;
        email?: string;
        bio?: string;
        lastSeen?: Date | null;
        createdAt?: string;
    } | null;
    isGroup?: boolean;
    conversation?: any; // To pass activeConv for group management
}

export function UserProfilePanel({ isOpen, onClose, user, isGroup, conversation }: UserProfilePanelProps) {
    const { user: currentUser } = useAuthStore();
    
    if (!user && !isGroup) return null;

    const handleRemoveMember = async (userId: string) => {
        try {
            await api.delete(`/api/app/${conversation.id}/members/${userId}`);
            toast.success("Member removed");
            // The socket might not sync this immediately without a refresh or store update
            // For now, reload window or rely on the user to refresh
            window.location.reload();
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await api.delete(`/api/app/${conversation.id}/leave`);
            toast.success("Left group");
            window.location.reload();
        } catch (error) {
            toast.error("Failed to leave group");
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background/95 backdrop-blur-xl border-l border-[var(--glass-border)] p-0 flex flex-col" aria-describedby={undefined}>
                <SheetHeader className="p-6 border-b border-[var(--glass-border)] text-center">
                    <div className="mx-auto w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary mb-4 glow-sm shadow-xl">
                        {isGroup ? (
                            <span className="text-3xl font-bold">{conversation?.name?.[0]?.toUpperCase() || "G"}</span>
                        ) : user?.avatar ? (
                            <img src={user.avatar} alt={user.name || user.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold">{user?.username?.[0]?.toUpperCase() || "?"}</span>
                        )}
                    </div>
                    <SheetTitle className="text-2xl font-bold">{isGroup ? conversation?.name : user?.name || user?.username}</SheetTitle>
                    <p className="text-muted-foreground">{isGroup ? `${conversation?.members?.length} Members` : `@${user?.username}`}</p>
                    {!isGroup && user?.bio && (
                        <p className="mt-4 text-sm text-foreground italic bg-white/5 p-3 rounded-lg border border-white/10">
                            "{user.bio}"
                        </p>
                    )}
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Contact Info */}
                    {!isGroup && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Info</h3>
                            <div className="space-y-3">
                                {user?.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 rounded-full bg-primary/10 text-primary"><Mail className="w-4 h-4" /></div>
                                        <span>{user.email}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary"><Phone className="w-4 h-4" /></div>
                                    <span>Not provided</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Group Members */}
                    {isGroup && conversation?.members && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                                Members
                            </h3>
                            <div className="space-y-3">
                                {conversation.members.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-white/10">
                                                {member.user.avatar ? (
                                                    <img src={member.user.avatar} alt={member.user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold">{member.user.username?.[0]?.toUpperCase()}</span>
                                                )}
                                            </div>
                                            <span className="text-sm">{member.user.name || member.user.username}</span>
                                        </div>
                                        {member.user.id !== currentUser?.id && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="w-6 h-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleRemoveMember(member.user.id)}
                                            >
                                                <UserMinus className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shared Media Tabs (Placeholder) */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Shared Media</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--glass-input)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] cursor-pointer transition-colors text-primary">
                                <ImageIcon className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-medium">Media</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--glass-input)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] cursor-pointer transition-colors text-primary">
                                <FileText className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-medium">Docs</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--glass-input)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] cursor-pointer transition-colors text-primary">
                                <LinkIcon className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-medium">Links</span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    {isGroup && (
                        <div className="space-y-4 pt-4 border-t border-red-500/10">
                            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Danger Zone</h3>
                            <Button 
                                variant="outline" 
                                className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10 justify-start"
                                onClick={handleLeaveGroup}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave Group
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
