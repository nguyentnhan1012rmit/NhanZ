import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");

    // Update local state when user changes (e.g. on open or re-fetch)
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setUsername(user.username || "");
        }
    }, [user, open]);

    // Handle Avatar Upload
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const formData = new FormData();
        formData.append("avatar", file);

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/app/users/avatar`, {
                method: "POST",
                headers: {
                    'x-user-id': user.id
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                // Update local store
                useAuthStore.setState(state => ({
                    user: state.user ? { ...state.user, avatar: data.avatar } : null
                }));
                // Persist to local storage
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...currentUser, avatar: data.avatar }));

                toast.success("Avatar updated successfully");
            } else {
                toast.error(data.error || "Failed to update avatar");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during upload");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/app/users/profile`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({
                    name,
                    username
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Update local store
                useAuthStore.setState(state => ({
                    user: state.user ? { ...state.user, ...data } : null
                }));
                // Persist to local storage
                localStorage.setItem('user', JSON.stringify(data));

                toast.success("Profile updated successfully");
                onOpenChange(false);
            } else {
                toast.error(data.error || "Failed to update profile");
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Make changes to your profile here.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <Avatar className="w-24 h-24 border-2 border-border">
                                <AvatarImage src={user.avatar || undefined} alt="Avatar" />
                                <AvatarFallback className="text-4xl">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isLoading} />
                            </label>
                        </div>
                        <p className="text-sm text-muted-foreground">Click to change avatar</p>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user.email || "No email"} disabled className="bg-muted opacity-70" />
                            <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
