import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import { useState } from "react";
import { SocketProvider } from "@/context/SocketContext";
import ChatPage from "./pages/chat/ChatPage";

function App() {
  const [user] = useState(true); // Mock user for now to access chat

  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              user ? (
                <ChatPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
