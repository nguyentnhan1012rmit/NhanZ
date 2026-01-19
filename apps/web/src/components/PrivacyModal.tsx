import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/useAuthStore";

interface PrivacyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
    // Status State
    const { status, setStatus } = useAuthStore();

    const handleStatusChange = (value: string) => {
        setStatus(value);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Privacy Settings</DialogTitle>
                    <DialogDescription>Manage your privacy preferences.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="grid gap-1.5">
                            <Label>Status</Label>
                            <p className="text-sm text-muted-foreground">How you appear to others.</p>
                        </div>
                        <Select value={status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                        <span>Active</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="dnd">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                        <span>Do not disturb</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="invisible">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        <span>Disappear</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="read-receipts">Read Receipts</Label>
                            <p className="text-sm text-muted-foreground">Let others know when you've read their messages.</p>
                        </div>
                        <Switch id="read-receipts" defaultChecked />
                    </div>

                    <div className="pt-4 border-t">
                        <Label>Blocked Accounts</Label>
                        <div className="mt-2 text-sm text-muted-foreground">
                            You have not blocked any accounts.
                        </div>
                        <Button variant="link" className="px-0 text-red-500">Manage Blocked Users</Button>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
