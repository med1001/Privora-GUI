import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";
import Register from "./components/Register";

const initialMessages: { [key: string]: string[] } = {
  "Mohamed Ben Moussa": ["Bonjour, comment ça va ?"],
  "Alice Johnson": ["Hey, how's it going?"],
  "Project Team": ["Team meeting at 3 PM."],
  "David Smith": ["Hello!"],
  "Sarah Connor": ["We need to talk..."],
};

const Chat: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [selectedChat, setSelectedChat] = useState<string>("Mohamed Ben Moussa");
  const [messages, setMessages] = useState<{ [key: string]: string[] }>(initialMessages);

  const sendMessage = (message: string) => {
    if (message.trim() !== "") {
      setMessages((prevMessages) => ({
        ...prevMessages,
        [selectedChat]: [...(prevMessages[selectedChat] || []), message],
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onSelect={setSelectedChat} selectedChat={selectedChat} />
      <ChatWindow
        selectedChat={selectedChat}
        messages={messages[selectedChat] || []}
        onSendMessage={sendMessage}
        onLogout={onLogout}
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
