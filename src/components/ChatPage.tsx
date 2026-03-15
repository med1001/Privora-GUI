import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { AnimatePresence } from "framer-motion";

const ChatPage = ({
  selectedChat,
  recentChats,
  unreadCounts,
  messages,
  onSendMessage,
  onLogout,
  onSelectChat,
  onStartCall,
  socketStatus,
  onlineUsers,
}: any) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isPeerOnline = selectedChat ? !!onlineUsers?.[selectedChat] : false;

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar */}
      <Sidebar
        onSelect={onSelectChat}
        selectedChat={selectedChat}
        recentChats={recentChats}
        unreadCounts={unreadCounts}
      />

      {/* Chat Window */}
      <div className="flex-grow relative">
        <ChatWindow
          selectedChat={selectedChat}
          messages={messages[selectedChat] || []}
          onSendMessage={onSendMessage}
          onLogout={onLogout}
          onSelectChat={onSelectChat}
          onStartCall={onStartCall}
          recentChats={recentChats}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          socketStatus={socketStatus}
          peerOnline={isPeerOnline}
        />

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <Sidebar
              onSelect={onSelectChat}
              selectedChat={selectedChat}
              recentChats={recentChats}
              unreadCounts={unreadCounts}
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
