import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import { useState } from "react";
import { SocketProvider } from "@/context/SocketContext";
import ChatPage from "./pages/chat/ChatPage";
import ChatLayout from "./pages/chat/ChatLayout";
import { useAuthStore } from "./stores/useAuthStore";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <SocketProvider>
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
