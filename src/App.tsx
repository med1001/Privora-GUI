import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar"; // ✅ Correct casing
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";
import Register from "./components/Register";
import useWebSocket from "./hooks/useWebSockets";

interface UserSummary {
  userId: string;
  displayName: string;
}

interface Messages {
  [userId: string]: string[];
}

const Chat: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [selectedChat, setSelectedChat] = useState<string>("");
  const [messages, setMessages] = useState<Messages>({});
  const [recentChats, setRecentChats] = useState<UserSummary[]>([]);

  const token = localStorage.getItem("token");
  const localUserId = localStorage.getItem("userId");

  const { sendMessage: sendWsMessage } = useWebSocket(token, (parsed: any) => {
    try {
      if (parsed.contacts && Array.isArray(parsed.contacts)) {
        setRecentChats(parsed.contacts);
      } else if (parsed.type === "message" && parsed.from && parsed.message) {
        const { from, message, fromDisplayName } = parsed;
  
        setMessages((prev) => ({
          ...prev,
          [from]: [...(prev[from] || []), `${fromDisplayName || from}: ${message}`],
        }));
  
        setRecentChats((prev) => {
          const exists = prev.some((c) => c.userId === from);
          if (exists) return prev;
          return [{ userId: from, displayName: fromDisplayName || from }, ...prev];
        });
  
        setSelectedChat((prevSelected) => prevSelected || from);
      } else if (parsed.type === "history" && Array.isArray(parsed.messages)) {
        const historyByUser: { [userId: string]: string[] } = {};
  
        parsed.messages.forEach((msg: any) => {
          const otherUserId = msg.from === localUserId ? msg.to : msg.from;
          const senderLabel = msg.from === localUserId ? localUserId : (msg.fromDisplayName || msg.from);
          const formattedMessage = `${senderLabel}: ${msg.message}`;
  
          if (!historyByUser[otherUserId]) {
            historyByUser[otherUserId] = [];
          }
          historyByUser[otherUserId].push(formattedMessage);
        });
  
        setMessages((prev) => ({
          ...prev,
          ...historyByUser,
        }));
  
        setRecentChats((prev) => {
          const newEntries = Object.keys(historyByUser)
            .filter((userId) => !prev.some((c) => c.userId === userId))
            .map((userId) => {
              const exampleMsg = parsed.messages.find(
                (msg: any) => msg.from === userId || msg.to === userId
              );
              return {
                userId,
                displayName: exampleMsg?.fromDisplayName || userId,  // ✅ Uses fromDisplayName if available
              };
            });
          return [...newEntries, ...prev];
        });
        
      }
    } catch (err) {
      console.error("Invalid WebSocket JSON:", parsed, err);
    }
  });
  
  

  const handleSelectChat = (userId: string, displayName?: string) => {
    console.log(`[handleSelectChat] 👉 Appelée avec :`, { userId, displayName });
  
    // Sélection de l'utilisateur pour ouvrir le chat
    setSelectedChat(userId);
    console.log(`[handleSelectChat] ✅ Chat sélectionné :`, userId);
  
    // Vérifie si cet utilisateur est déjà dans la liste des chats récents
    const exists = recentChats.some((c) => c.userId === userId);
    console.log(`[handleSelectChat] 🔎 Existe déjà dans recentChats ?`, exists);
  
    if (!exists) {
      const newEntry = { userId, displayName: displayName || userId };
      setRecentChats((prev) => [newEntry, ...prev]);
      console.log(`[handleSelectChat] ➕ Ajouté à recentChats :`, newEntry);
    } else {
      console.log(`[handleSelectChat] ⚠️ Déjà présent → Pas d'ajout`);
    }
  };

  const sendMessage = (message: string, recipientUserId: string) => {
    if (message.trim() !== "" && recipientUserId && localUserId) {
      const displayName = localStorage.getItem("displayName") || localUserId;
      setMessages((prev) => ({
        ...prev,
        [recipientUserId]: [
          ...(prev[recipientUserId] || []),
          `${localUserId}: ${message}`,
        ],
      }));

      sendWsMessage(message, recipientUserId,displayName);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        onSelect={(userId: string) => handleSelectChat(userId)}
        selectedChat={selectedChat}
        recentChats={recentChats}
      />
      <ChatWindow
        selectedChat={selectedChat}
        messages={messages[selectedChat] || []}
        onSendMessage={sendMessage}
        onLogout={onLogout}
        onSelectChat={(userId, displayName) => handleSelectChat(userId, displayName)}
        recentChats={recentChats}  
      />
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
    navigate("/chat");
  };

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={login} />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/chat"
        element={isAuthenticated ? <Chat onLogout={logout} /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} />
    </Routes>
  );
};

export default App;
