import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { useThemeStore } from "@/stores/useThemeStore";

export default function ChatLayout() {
    const { backgroundPattern } = useThemeStore();

    const getBackgroundStyle = () => {
        switch (backgroundPattern) {
            case "dots":
                return { backgroundImage: 'radial-gradient(circle, var(--color-primary) 1px, transparent 1px)', backgroundSize: '24px 24px' };
            case "grid":
                return { backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' };
            case "waves":
                return { backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' viewBox=\'0 0 100 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.639 0-15.875 1.336-26.146 5.216-1.024.39-2.12.8-3.268 1.228-2.51.73-5.139 1.691-8.233 2.928h5.831zm73.916 0c-2.51-.73-5.139-1.691-8.233-2.928C77.464 13.565 72.164 12.3 62 12.063V14c8.411.233 12.827 1.365 21.629 4.928.955.383 1.869.74 2.75 1.072h8.721zm-100 0C-2.49 19.27-5.12 18.309-8.214 17.072-17.682 13.347-23.689 12-34 12v2c10.271 0 15.362 1.222 24.629 4.928C-8.416 19.311-7.502 19.668-6.62 20h11.72z\' fill=\'rgba(255,255,255,0.02)\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' };
            default:
                return {};
        }
    };

    return (
        <div className="flex h-screen w-full bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background relative">
            <div className="absolute inset-0 z-0 opacity-50" style={getBackgroundStyle()} />
            <div className="z-10 flex w-full h-full">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Outlet />
            </main>
            </div>
            <CommandPalette />
        </div>
    );
}
