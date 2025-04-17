import React, { useState, useEffect, useRef } from "react";
import { Search, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";

interface ChatWindowProps {
  selectedChat: string;
  messages: string[];
  onSendMessage: (message: string) => void;
  onLogout: () => void;
  onSelectChat: (chatName: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  onSendMessage,
  onLogout,
  onSelectChat,
}) => {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const username = localStorage.getItem("username");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getUserInitials = () => {
    if (!isAuthenticated) return "";
    const fullName = localStorage.getItem("username") || "?";
    const parts = fullName.trim().split(" ");
    const initials = parts.length > 1
      ? parts[0][0] + parts[1][0]
      : parts[0][0];
    return initials.toUpperCase();
  };

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:5000/search-users?q=${search}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Error fetching users", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const send = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col w-3/4 bg-white shadow-md">
      {/* Header */}
      <div className="bg-blue-700 text-white p-4 flex items-center justify-between">
        <span className="text-lg font-semibold">{selectedChat || "No user selected"}</span>

        <div className="relative">
          <input
            type="text"
            placeholder="Search for users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 pl-10 rounded-lg text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />

          {loading && !suggestions.length && (
            <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg max-h-60 flex items-center justify-center">
              <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-y-auto z-10">
              {suggestions.map((user) => (
                <div
                  key={user}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    onSelectChat(user);
                    setSearch("");
                    setSuggestions([]);
                  }}
                >
                  <span className="text-black">{user}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 bg-gray-300 text-black rounded-full flex items-center justify-center font-semibold cursor-pointer hover:bg-gray-400">
                {getUserInitials()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white shadow-md rounded-lg p-2 w-40">
              <DropdownMenuItem onClick={() => alert("Settings clicked!")}>
                <Settings className="w-5 h-5 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="w-5 h-5 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const [sender, ...rest] = msg.split(": ");
          const isOwnMessage = sender === username;
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg max-w-xs ${
                isOwnMessage
                  ? "bg-blue-500 text-white self-end ml-auto"
                  : "bg-gray-200 text-black self-start mr-auto"
              }`}
            >
              {rest.join(": ")}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-100 flex items-center">
        <input
          type="text"
          className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
