import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";
import Register from "./components/Register";
import useWebSocket from "./hooks/useWebSockets";

interface Messages {
  [key: string]: string[];
}

interface ChatProps {
  onLogout: () => void;
}

const Chat: React.FC<ChatProps> = ({ onLogout }) => {
  const [selectedChat, setSelectedChat] = useState<string>("");
  const [messages, setMessages] = useState<Messages>({});
  const [recentChats, setRecentChats] = useState<string[]>([]);

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const { sendMessage: sendWsMessage } = useWebSocket(token, (parsed: any) => {
    try {
      if (parsed.type === "message" && parsed.from && parsed.message) {
        const { from, message } = parsed;

        setMessages((prev) => ({
          ...prev,
          [from]: [...(prev[from] || []), `${from}: ${message}`],
        }));

        setRecentChats((prev) =>
          prev.includes(from) ? prev : [from, ...prev]
        );

        if (!selectedChat) setSelectedChat(from);
      } 
      
      // ✅ Handle initial contact list
      else if (parsed.contacts && Array.isArray(parsed.contacts)) {
        console.log("[WebSocket] Setting recent chats from backend:", parsed.contacts);
        setRecentChats(parsed.contacts);
      }

    } catch (err) {
      console.error("Invalid WebSocket JSON:", parsed, err);
    }
  });

  const sendMessage = (message: string) => {
    if (message.trim() !== "" && selectedChat && username) {
      setMessages((prev) => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), `${username}: ${message}`],
      }));

      setRecentChats((prev) =>
        prev.includes(selectedChat) ? prev : [selectedChat, ...prev]
      );

      sendWsMessage(message, selectedChat);
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
