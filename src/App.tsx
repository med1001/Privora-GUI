import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";
import Register from "./components/Register";
import useWebSocket from "./hooks/useWebSockets"; // Or wherever it's located

interface Messages {
  [key: string]: string[]; // Explicitly define message type
}

const initialMessages: Messages = {
  "Mohamed Ben Moussa": ["Bonjour, comment ça va ?"],
  "Alice Johnson": ["Hey, how's it going?"],
  "Project Team": ["Team meeting at 3 PM."],
  "David Smith": ["Hello!"],
  "Sarah Connor": ["We need to talk..."],
};

interface ChatProps {
  onLogout: () => void;
}

const Chat: React.FC<ChatProps> = ({ onLogout }) => {
  const [selectedChat, setSelectedChat] = useState<string>("Mohamed Ben Moussa");
  const [messages, setMessages] = useState<Messages>(initialMessages);
  const [recentChats, setRecentChats] = useState<string[]>(Object.keys(initialMessages));

  const token = localStorage.getItem("token");

  // ✅ Corrected destructuring (removed socketStatus)
  const { sendMessage: sendWsMessage } = useWebSocket(token, (message: string) => {
    console.log("[Chat] WebSocket message received:", message);

    const [type, sender, content] = message.split(":");
    const from = type === "PRIVATE" ? sender : "Server";

    setMessages((prev) => ({
      ...prev,
      [from]: [...(prev[from] || []), content],
    }));

    setRecentChats((prev) => (prev.includes(from) ? prev : [from, ...prev]));
  });

  const sendMessage = (message: string) => {
    if (message.trim() !== "") {
      setMessages((prev) => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), message],
      }));

      setRecentChats((prev) =>
        prev.includes(selectedChat) ? prev : [selectedChat, ...prev]
      );

      // Send to backend
      sendWsMessage(message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        onSelect={setSelectedChat}
        selectedChat={selectedChat}
        recentChats={recentChats}
      />
      <ChatWindow
        selectedChat={selectedChat}
        messages={messages[selectedChat] || []}
        onSendMessage={sendMessage}
        onLogout={onLogout}
        onSelectChat={setSelectedChat}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("[APP] Checking authentication. Token found:", token);
    setIsAuthenticated(!!token);
  }, []);

  const login = (token: string) => {
    console.log("[APP] Login successful, storing token:", token);
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
    navigate("/chat");
  };

  const logout = () => {
    console.log("[APP] Logging out...");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={login} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={isAuthenticated ? <Chat onLogout={logout} /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} />
    </Routes>
  );
};

export default App;
