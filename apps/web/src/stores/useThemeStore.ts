import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentColor = "blue" | "red" | "green" | "purple" | "orange" | "pink" | "teal" | "indigo";
export type BackgroundPattern = "none" | "dots" | "grid" | "waves" | "topography";
export type BubbleStyle = "rounded" | "sharp" | "cloud";
export type FontSize = "small" | "normal" | "large";
export type ChatDensity = "compact" | "comfortable" | "spacious";

interface ThemeState {
    accentColor: AccentColor;
    backgroundPattern: BackgroundPattern;
    bubbleStyle: BubbleStyle;
    fontSize: FontSize;
    chatDensity: ChatDensity;
    soundEnabled: boolean;
    setAccentColor: (color: AccentColor) => void;
    setBackgroundPattern: (pattern: BackgroundPattern) => void;
    setBubbleStyle: (style: BubbleStyle) => void;
    setFontSize: (size: FontSize) => void;
    setChatDensity: (density: ChatDensity) => void;
    setSoundEnabled: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            accentColor: "blue",
            backgroundPattern: "none",
            bubbleStyle: "rounded",
            fontSize: "normal",
            chatDensity: "comfortable",
            soundEnabled: true,
            setAccentColor: (color) => set({ accentColor: color }),
            setBackgroundPattern: (pattern) => set({ backgroundPattern: pattern }),
            setBubbleStyle: (style) => set({ bubbleStyle: style }),
            setFontSize: (size) => set({ fontSize: size }),
            setChatDensity: (density) => set({ chatDensity: density }),
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
        }),
        {
            name: "nhanz-theme-storage",
        }
    )
);
