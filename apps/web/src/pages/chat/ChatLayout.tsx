import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export default function ChatLayout() {
    return (
        <div className="flex h-screen w-full bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
