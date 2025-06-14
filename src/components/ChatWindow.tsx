import React, { useState, useEffect, useRef } from "react";
import { LogOut, Settings, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";

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
  recentChats: RecentChat[];
  onToggleSidebar?: () => void; // For mobile drawer toggle
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  onSendMessage,
  onLogout,
  onSelectChat,
  recentChats,
  onToggleSidebar,
}) => {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayName = localStorage.getItem("displayName") || "User";
  const userId = localStorage.getItem("userId");

  const selectedChatDisplayName =
    recentChats.find((c) => c.userId === selectedChat)?.displayName ||
    selectedChat ||
    "No user selected";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    if (message.trim() && selectedChat) {
      onSendMessage(message, selectedChat);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-blue-700 text-white p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1 rounded hover:bg-blue-600"
          >
            <Menu size={24} />
          </button>
          <span className="text-lg font-semibold truncate">
            {selectedChatDisplayName}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-10 h-10 bg-gray-300 text-black rounded-full flex items-center justify-center font-semibold"
              aria-label="Profile menu"
            >
              {(displayName.split(" ")[0][0] +
                (displayName.split(" ")[1]?.[0] || "")
              ).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white shadow-md rounded-lg p-2 w-40 z-30">
            <DropdownMenuItem onClick={() => alert("Settings clicked!")}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div
        className="flex-grow p-3 overflow-y-auto space-y-3"
        ref={scrollRef}
      >
        {messages.map((msg, idx) => {
          const [sender, ...rest] = msg.split(": ");
          const isOwn = sender === userId;
          return (
            <div
              key={idx}
              className={`p-2 rounded-lg max-w-xs ${
                isOwn
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-gray-200 text-black mr-auto"
              }`}
            >
              {rest.join(": ")}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-gray-100 flex items-center gap-2">
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
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
