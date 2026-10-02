import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, MessageSquare, Search, Settings, Phone, Video, Send, Mic, Paperclip } from "lucide-react";

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    { key: "Ctrl + K", desc: "Open Command Palette", icon: <Command className="w-4 h-4" /> },
    { key: "Ctrl + /", desc: "Show Keyboard Shortcuts", icon: <Command className="w-4 h-4" /> },
    { key: "Esc", desc: "Close Modals / Deselect", icon: <Command className="w-4 h-4" /> },
    { key: "Enter", desc: "Send Message", icon: <Send className="w-4 h-4" /> },
    { key: "Shift + Enter", desc: "New Line in Message", icon: <MessageSquare className="w-4 h-4" /> },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass border-[var(--glass-border)] bg-background/80 backdrop-blur-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        <Command className="w-6 h-6 text-primary" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {shortcuts.map((shortcut, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[var(--glass-input)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-primary/10 text-primary">
                                    {shortcut.icon}
                                </div>
                                <span className="font-medium text-foreground">{shortcut.desc}</span>
                            </div>
                            <kbd className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-mono font-bold tracking-widest shadow-sm">
                                {shortcut.key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
