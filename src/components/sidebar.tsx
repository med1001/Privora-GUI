import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface UserSuggestion {
  userId: string;
  displayName: string;
}

interface SidebarProps {
  onSelect: (userId: string, displayName?: string) => void;
  selectedChat: string;
  recentChats: UserSuggestion[];
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onSelect,
  selectedChat,
  recentChats,
  isMobile = false,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

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
    onSelect(user.userId, user.displayName);
    setSearch("");
    setSuggestions([]);
    if (isMobile) onClose?.();
  };

  return (
    <motion.div
      initial={{ x: isMobile ? "-100%" : 0 }}
      animate={{ x: 0 }}
      exit={{ x: isMobile ? "-100%" : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`bg-blue-900 text-white ${
        isMobile ? "fixed inset-y-0 left-0 w-64 z-40" : "w-64 hidden md:flex"
      } flex flex-col p-4`}
    >
      {isMobile && (
        <button
          onClick={onClose}
          className="text-white mb-4 bg-blue-700 px-2 py-1 rounded"
        >
          Close
        </button>
      )}

      <h1 className="text-2xl font-bold mb-4">Privora</h1>

      {/* Mobile Search ONLY */}
      {isMobile && (
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 pl-9 rounded text-black"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />

          {loading && !suggestions.length && (
            <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg p-2 text-center text-black">
              <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-y-auto z-20 text-black">
              {suggestions.map((user) => (
                <div
                  key={user.userId}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(user)}
                >
                  {user.displayName}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className="text-sm font-semibold mb-2">Recent Chats</h2>

      <ul className="space-y-2 flex-1 overflow-y-auto">
        {recentChats.map(({ userId, displayName }) => (
          <li
            key={userId}
            onClick={() => {
              onSelect(userId, displayName);
              if (isMobile) onClose?.();
            }}
            className={`p-2 rounded cursor-pointer ${
              userId === selectedChat
                ? "bg-blue-700"
                : "hover:bg-blue-700 transition"
            }`}
          >
            {displayName}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default Sidebar;
