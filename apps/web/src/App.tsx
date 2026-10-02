import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import { SocketProvider } from "@/context/SocketContext";
import ChatPage from "./pages/chat/ChatPage";
import ChatLayout from "./pages/chat/ChatLayout";
import { useAuthStore } from "./stores/useAuthStore";
import { useThemeStore, AccentColor } from "./stores/useThemeStore";
import { useEffect } from "react";
import { CallModal } from "./components/CallModal";
import { PushNotificationManager } from "./components/PushNotificationManager";

const ACCENT_COLORS_MAP: Record<AccentColor, string> = {
  blue: "#0ea5e9",
  red: "#ef4444",
  green: "#10b981",
  purple: "#8b5cf6",
  orange: "#f97316",
  pink: "#ec4899",
  teal: "#14b8a6",
  indigo: "#6366f1",
};

function ThemeInjector() {
  const { accentColor } = useThemeStore();

  useEffect(() => {
    const hex = ACCENT_COLORS_MAP[accentColor] || ACCENT_COLORS_MAP.blue;
    document.documentElement.style.setProperty("--primary", hex);
    document.documentElement.style.setProperty("--ring", hex);
    document.documentElement.style.setProperty("--sidebar-primary", hex);
    document.documentElement.style.setProperty("--sidebar-ring", hex);
  }, [accentColor]);

  return null;
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <SocketProvider>
      <ThemeInjector />
      <PushNotificationManager />
      <CallModal />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={isAuthenticated ? <ChatLayout /> : <Navigate to="/login" />}>
            <Route index element={<ChatPage />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
