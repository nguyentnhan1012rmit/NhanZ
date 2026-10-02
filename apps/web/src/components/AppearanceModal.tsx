import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore, AccentColor, BackgroundPattern, BubbleStyle, FontSize, ChatDensity } from "@/stores/useThemeStore";
import { Check, Volume2 } from "lucide-react";

interface AppearanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ACCENT_COLORS: { id: AccentColor; hex: string; name: string }[] = [
    { id: "blue", hex: "#0ea5e9", name: "Ocean Blue" },
    { id: "red", hex: "#ef4444", name: "Ruby Red" },
    { id: "green", hex: "#10b981", name: "Emerald" },
    { id: "purple", hex: "#8b5cf6", name: "Amethyst" },
    { id: "orange", hex: "#f97316", name: "Tangerine" },
    { id: "pink", hex: "#ec4899", name: "Flamingo" },
    { id: "teal", hex: "#14b8a6", name: "Teal" },
    { id: "indigo", hex: "#6366f1", name: "Indigo" },
];

const BACKGROUNDS: { id: BackgroundPattern; name: string }[] = [
    { id: "none", name: "Solid Color" },
    { id: "dots", name: "Dotted" },
    { id: "grid", name: "Grid" },
    { id: "waves", name: "Waves" },
];

const BUBBLE_STYLES: { id: BubbleStyle; name: string }[] = [
    { id: "rounded", name: "Rounded" },
    { id: "sharp", name: "Sharp" },
    { id: "cloud", name: "Cloud" },
];

const DENSITIES: { id: ChatDensity; name: string }[] = [
    { id: "compact", name: "Compact" },
    { id: "comfortable", name: "Comfortable" },
    { id: "spacious", name: "Spacious" },
];

export function AppearanceModal({ open, onOpenChange }: AppearanceModalProps) {
    const { 
        accentColor, setAccentColor,
        backgroundPattern, setBackgroundPattern,
        bubbleStyle, setBubbleStyle,
        chatDensity, setChatDensity,
        soundEnabled, setSoundEnabled
    } = useThemeStore();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] glass border-white/5 text-foreground max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Appearance</DialogTitle>
                    <DialogDescription>Customize how NhanZ looks for you.</DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-8 py-4">
                    {/* Accent Color */}
                    <div className="space-y-3">
                        <Label>Accent Color</Label>
                        <div className="flex flex-wrap gap-3">
                            {ACCENT_COLORS.map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => setAccentColor(color.id)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                        accentColor === color.id ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                >
                                    {accentColor === color.id && <Check className="w-5 h-5 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Background */}
                    <div className="space-y-3">
                        <Label>Chat Background Pattern</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {BACKGROUNDS.map((bg) => (
                                <button
                                    key={bg.id}
                                    onClick={() => setBackgroundPattern(bg.id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                        backgroundPattern === bg.id 
                                            ? 'border-primary bg-primary/10' 
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="font-medium text-sm">{bg.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bubble Style */}
                    <div className="space-y-3">
                        <Label>Message Bubble Style</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {BUBBLE_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setBubbleStyle(style.id)}
                                    className={`p-3 rounded-lg border text-center transition-all ${
                                        bubbleStyle === style.id 
                                            ? 'border-primary bg-primary/10' 
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="font-medium text-sm">{style.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Density */}
                    <div className="space-y-3">
                        <Label>Chat Density</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {DENSITIES.map((density) => (
                                <button
                                    key={density.id}
                                    onClick={() => setChatDensity(density.id)}
                                    className={`p-3 rounded-lg border text-center transition-all ${
                                        chatDensity === density.id 
                                            ? 'border-primary bg-primary/10' 
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="font-medium text-sm">{density.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sound Effects */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 text-primary" />
                                    Sound Effects
                                </Label>
                                <p className="text-xs text-muted-foreground">Play a sound when receiving a new message.</p>
                            </div>
                            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-sm border-0">Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
