import React, { useState, useEffect } from "react";
import { Search, LogOut, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./dropdown-menu";

interface ChatWindowProps {
  selectedChat: string;
  messages: string[];
  onSendMessage: (message: string) => void;
  onLogout: () => void;
  onSelectChat: (chatName: string) => void; // Added for selecting users
}

const ChatWindow: React.FC<ChatWindowProps> = ({ selectedChat, messages, onSendMessage, onLogout, onSelectChat }) => {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false); // Track loading state

  useEffect(() => {
    if (search.trim() === "") {
      setSuggestions([]); // Clear suggestions if search is empty
      return;
    }

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token"); // Get the JWT token from local storage
        if (!token) {
          console.error("No token found");
          return;
        }

        setLoading(true); // Set loading to true when starting the fetch

        const response = await fetch(`http://127.0.0.1:5000/search-users?q=${search}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Include the JWT token in the request header
          },
        });

        if (response.status === 401) {
          console.error("Unauthorized request. Check your authentication token.");
          return;
        }

        const data = await response.json();
        console.log("Received suggestions: ", data);  // Log the response

        setSuggestions(data); // Update suggestions state
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false); // Set loading to false after fetch completes
      }
    };

    const timeoutId = setTimeout(fetchUsers, 300); // Add delay to debounce search
    return () => clearTimeout(timeoutId); // Clean up timeout on unmount or search change
  }, [search]);

  const sendMessage = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col w-3/4 bg-white shadow-md">
      {/* Header with search bar */}
      <div className="bg-blue-700 text-white p-4 flex items-center justify-between">
        <span className="text-lg font-semibold">{selectedChat}</span>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search for users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)} // Update search state on change
            className="p-2 pl-10 rounded-lg text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />

          {/* Suggestions */}
          {loading && !suggestions.length && (
            <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg max-h-60 flex items-center justify-center">
              <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div> {/* Spinner */}
            </div>
          )}

          {suggestions.length > 0 ? (
            <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-y-auto z-10 border-2 border-red-500">
              {suggestions.map((user) => (
                <div
                  key={user}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    onSelectChat(user); // Select user from suggestions
                    setSearch(""); // Clear search input
                    setSuggestions([]); // Hide suggestions after selecting
                  }}
                >
                  <span className="text-black">{user}</span> {/* Ensure the suggestion text is black */}
                </div>
              ))}
            </div>
          ) : (
            search.trim() && <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg p-2 text-center">No users found</div>
          )}
        </div>

        {/* User menu */}
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
            <DropdownMenuItem className="flex items-center p-2 hover:bg-gray-100 rounded text-red-600" onClick={onLogout}>
              <LogOut className="w-5 h-5 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
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

      {/* Message input */}
      <div className="p-4 border-t bg-gray-100 flex items-center">
        <input
          type="text"
          className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()} // Send message on Enter
        />
        <button
          onClick={sendMessage}
          className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
