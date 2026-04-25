import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Settings } from "lucide-react";
import { auth } from "../firebase-config";
import { getApiBaseUrl, resolveApiAssetUrl } from "../lib/apiBase";
import { UserSummary } from "../App";
import Avatar from "./Avatar";

interface UserSuggestion extends UserSummary {}

interface SidebarProps {
  onSelect: (userId: string, displayName?: string, photoURL?: string | null) => void;
  onOpenSettings: () => void;
  selectedChat: string;
  recentChats: UserSuggestion[];
  selfSummary?: UserSummary | null;
  unreadCounts?: Record<string, number>;
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onSelect,
  onOpenSettings,
  selectedChat,
  recentChats,
  selfSummary,
  unreadCounts = {},
  isMobile = false,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = getApiBaseUrl();
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchUsers = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/search-users?q=${encodeURIComponent(search)}`,
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
  }, [search, API_BASE_URL]);

  const handleSuggestionClick = (user: UserSuggestion) => {
    onSelect(user.userId, user.displayName, user.photoURL);
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
        isMobile ? "fixed inset-y-0 left-0 w-64 z-[60] shadow-2xl" : "w-64 hidden md:flex"   
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
                  {user.displayName && user.displayName.includes("@")
                    ? (() => {
                        const localPart = user.displayName.split("@")[0];
                        const base = localPart.split("+")[0];
                        return base || user.displayName;
                      })()
                    : user.displayName}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className="text-sm font-semibold mb-2">Recent Chats</h2>

      <ul className="space-y-2 flex-1 overflow-y-auto">
        {recentChats.map(({ userId, displayName, photoURL }) => (
          <li
            key={userId}
            onClick={() => {
              onSelect(userId, displayName, photoURL);
              if (isMobile) onClose?.();
            }}
            className={`p-2 rounded cursor-pointer flex items-center justify-between gap-2 ${
              userId === selectedChat
                ? "bg-blue-700"
                : "hover:bg-blue-700 transition"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                src={resolveApiAssetUrl(photoURL)}
                alt={displayName}
                label={displayName || userId}
                className="w-8 h-8 text-xs border border-white/20"
                fallbackClassName="bg-blue-700 text-white"
              />
              <span className="truncate">
              {userId === localStorage.getItem("userId") ? `${displayName} (me)` : displayName}
              </span>
            </div>
            {unreadCounts[userId] ? (
              <span className="min-w-6 h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200">
                {unreadCounts[userId] > 99 ? "99+" : unreadCounts[userId]}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {selfSummary && (
        <div className="pt-4 mt-4 border-t border-white/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={resolveApiAssetUrl(selfSummary.photoURL)}
              alt={selfSummary.displayName}
              label={selfSummary.displayName || selfSummary.userId}
              className="w-10 h-10 text-sm border border-white/20"
              fallbackClassName="bg-blue-700 text-white"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{selfSummary.displayName}</p>
              <p className="text-xs text-blue-200 truncate">{selfSummary.userId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-blue-700 transition"
            aria-label="Open settings"
          >
            <Settings size={18} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;
