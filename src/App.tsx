import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // ❌ Remove BrowserRouter
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

const Chat: React.FC = () => {
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
      />
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Routes> {/* ✅ No more Router here */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} />
    </Routes>
  );
};

export default App;
