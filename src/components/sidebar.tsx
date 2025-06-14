import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface UserSummary {
  userId: string;
  displayName: string;
}

interface SidebarProps {
  onSelect: (userId: string) => void;
  selectedChat: string;
  recentChats: UserSummary[];
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect, selectedChat, recentChats }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 250 }}
      className="h-screen bg-blue-900 text-white p-4 flex flex-col items-center shadow-lg"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-6 p-2 rounded-full bg-blue-700 hover:bg-blue-600"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <h1 className={`text-2xl font-bold mb-6 ${collapsed ? "hidden" : "block"}`}>
        Privora
      </h1>

      <h2 className={`text-lg font-semibold mb-4 ${collapsed ? "hidden" : "block"}`}>
        Chat
      </h2>

      <div className="w-full">
        <h3 className={`text-sm font-medium mb-2 ${collapsed ? "hidden" : "block"}`}>
          Recent
        </h3>
        <ul className="space-y-3 w-full">
          {recentChats.map(({ userId, displayName }) => (
            <motion.li
              key={userId}
              onClick={() => onSelect(userId)}
              className={`p-3 rounded-lg cursor-pointer transition ${
                userId === selectedChat
                  ? "bg-blue-700"
                  : "bg-blue-800 hover:bg-blue-700"
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {!collapsed && displayName}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default Sidebar;
