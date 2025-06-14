import React, { useState, useEffect, useRef } from "react";
import { Search, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";

interface UserSuggestion {
  userId: string;
  displayName: string;
}

interface RecentChat {
  userId: string;
  displayName: string;
}

interface ChatWindowProps {
  selectedChat: string;
  messages: string[];
  onSendMessage: (message: string, recipientUserId: string) => void;
  onLogout: () => void;
  onSelectChat: (chatId: string, displayName?: string) => void;
  recentChats: RecentChat[]; // NEW PROP for display names
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  onSendMessage,
  onLogout,
  onSelectChat,
  recentChats, // NEW PROP
}) => {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayName = localStorage.getItem("displayName") || "User";
  const userId = localStorage.getItem("userId");

  // Map selectedChat (userId) to displayName
  const selectedChatDisplayName =
    recentChats.find((c) => c.userId === selectedChat)?.displayName ||
    selectedChat ||
    "No user selected";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        const res = await fetch(
          `http://localhost:8080/search-users?q=${encodeURIComponent(search)}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data: UserSuggestion[] = await res.json();
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

  const handleSuggestionClick = (user: UserSuggestion) => {
    console.log("User selected:", user.userId, user.displayName);
    onSelectChat(user.userId, user.displayName);
    setSearch("");
    setSuggestions([]);
  };

  const send = () => {
    if (message.trim() && selectedChat) {
      onSendMessage(message, selectedChat);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col w-3/4 bg-white shadow-md">
      {/* Header */}
      <div className="bg-blue-700 text-white p-4 flex items-center justify-between">
        <span className="text-lg font-semibold truncate max-w-xs">
          {selectedChatDisplayName}
        </span>

        {/* Search */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search for users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 pl-10 rounded-lg text-black border border-gray-300"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />

          {loading && !suggestions.length && (
            <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg max-h-60 flex items-center justify-center">
              <div className="w-8 h-8 border-t-4 border-blue-500 rounded-full animate-spin"></div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-y-auto z-10">
              {suggestions.map((user) => (
                <div
                  key={user.userId}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(user)}
                >
                  <span className="text-black">{user.displayName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-10 h-10 bg-gray-300 text-black rounded-full flex items-center justify-center font-semibold cursor-pointer hover:bg-gray-400"
              aria-label="Profile menu"
            >
              {(displayName.split(" ")[0][0] + (displayName.split(" ")[1]?.[0] || "")).toUpperCase()}
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
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3" ref={scrollRef}>
        {messages.map((msg, idx) => {
          const [sender, ...rest] = msg.split(": ");
          const isOwnMessage = sender === userId;
          const key = `${msg}-${idx}`;

          return (
            <div
              key={key}
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

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-100 flex items-center">
        <input
          type="text"
          className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
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
