import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Calendar, Phone, MapPin, Image as ImageIcon, Link as LinkIcon, FileText } from "lucide-react";

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
}

export function UserProfilePanel({ isOpen, onClose, user, isGroup }: UserProfilePanelProps) {
    if (!user && !isGroup) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background/95 backdrop-blur-xl border-l border-[var(--glass-border)] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-[var(--glass-border)] text-center">
                    <div className="mx-auto w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary mb-4 glow-sm shadow-xl">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name || user.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold">{user?.username?.[0]?.toUpperCase() || "?"}</span>
                        )}
                    </div>
                    <SheetTitle className="text-2xl font-bold">{user?.name || user?.username}</SheetTitle>
                    <p className="text-muted-foreground">@{user?.username}</p>
                    {user?.bio && (
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
                </div>
            </SheetContent>
        </Sheet>
    );
}
