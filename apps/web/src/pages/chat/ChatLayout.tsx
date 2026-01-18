import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export default function ChatLayout() {
    return (
        <div className="flex h-screen w-full bg-background">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
