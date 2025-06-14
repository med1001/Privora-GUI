import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { AnimatePresence } from "framer-motion";

const ChatPage = ({
  selectedChat,
  recentChats,
  messages,
  onSendMessage,
  onLogout,
  onSelectChat,
}: any) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar */}
      <Sidebar
        onSelect={onSelectChat}
        selectedChat={selectedChat}
        recentChats={recentChats}
      />

      {/* Chat Window */}
      <div className="flex-grow relative">
        <ChatWindow
          selectedChat={selectedChat}
          messages={messages[selectedChat] || []}
          onSendMessage={onSendMessage}
          onLogout={onLogout}
          onSelectChat={onSelectChat}
          recentChats={recentChats}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <Sidebar
              onSelect={onSelectChat}
              selectedChat={selectedChat}
              recentChats={recentChats}
              isMobile
              onClose={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatPage;
