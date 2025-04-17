import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  onSelect: (name: string) => void;
  selectedChat: string;
  recentChats: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ onSelect, selectedChat, recentChats }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

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

      {/* Sidebar Title */}
      <h1 className={`text-2xl font-bold mb-6 ${collapsed ? 'hidden' : 'block'}`}>Privora</h1>

      {/* Chat Section */}
      <h2 className={`text-lg font-semibold mb-4 ${collapsed ? 'hidden' : 'block'}`}>Chat</h2>

      {/* Recent Chats */}
      <div className="w-full">
        <h3 className={`text-sm font-medium mb-2 ${collapsed ? 'hidden' : 'block'}`}>Recent</h3>
        <ul className="space-y-3 w-full">
          {recentChats?.map((chat) => (
            <motion.li 
              key={chat} 
              onClick={() => onSelect(chat)}
              className={`p-3 rounded-lg cursor-pointer transition ${chat === selectedChat ? 'bg-blue-700' : 'bg-blue-800 hover:bg-blue-700'}`}
              whileHover={{ scale: 1.05 }}
            >
              {!collapsed && chat}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default Sidebar;
