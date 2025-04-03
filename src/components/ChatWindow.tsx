import React, { useState } from "react";
import { Search, LogOut, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./dropdown-menu";

interface ChatWindowProps {
  selectedChat: string;
  messages: string[];
  onSendMessage: (message: string) => void;
  onLogout: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ selectedChat, messages, onSendMessage, onLogout }) => {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const sendMessage = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col w-3/4 bg-white shadow-md">
      <div className="bg-blue-700 text-white p-4 flex items-center justify-between">
        <span className="text-lg font-semibold">{selectedChat}</span>

        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 pl-10 rounded-lg text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 bg-gray-300 text-black rounded-full flex items-center justify-center font-semibold cursor-pointer hover:bg-gray-400">
              TU
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="bg-white shadow-md rounded-lg p-2 w-40">
            <DropdownMenuItem className="flex items-center p-2 hover:bg-gray-100 rounded" onClick={() => alert("Settings clicked!")}> 
              <Settings className="w-5 h-5 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center p-2 hover:bg-gray-100 rounded text-red-600"
              onClick={() => {
                console.log("Disconnect clicked!");
                onLogout();
              }}
            >
              <LogOut className="w-5 h-5 mr-2" /> Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-xs ${
              index % 2 === 0 ? "bg-gray-200 self-start" : "bg-blue-500 text-white self-end"
            }`}
          >
            {msg}
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-gray-100 flex items-center">
        <input
          type="text"
          className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Écrivez un message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
