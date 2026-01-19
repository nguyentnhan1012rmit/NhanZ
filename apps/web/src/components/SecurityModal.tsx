import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

interface SecurityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SecurityModal({ open, onOpenChange }: SecurityModalProps) {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Password States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.id || ''
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Password updated successfully");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                onOpenChange(false);
            } else {
                toast.error(data.error || "Failed to update password");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Security Settings</DialogTitle>
                    <DialogDescription>Manage your account security.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <h4 className="font-medium leading-none">Change Password</h4>
                        <div className="grid gap-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                        <Button onClick={handleChangePassword} disabled={isLoading} className="w-full">
                            Update Password
                        </Button>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="grid gap-1.5">
                                <Label htmlFor="2fa">Two-Factor Authentication</Label>
                                <p className="text-xs text-muted-foreground">Add an extra layer of security.</p>
                            </div>
                            <Switch id="2fa" disabled />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right">Coming soon</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
