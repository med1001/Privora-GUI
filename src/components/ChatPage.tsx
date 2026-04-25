import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { AnimatePresence } from "framer-motion";
import SettingsModal from "./SettingsModal";

const ChatPage = ({
  selectedChat,
  recentChats,
  unreadCounts,
  messages,
  onSendMessage,
  onSendReaction,
  onLogout,
  onSelectChat,
  onStartCall,
  socketStatus,
  onlineUsers,
  selfSummary,
  onProfileUpdated,
}: any) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isPeerOnline = selectedChat ? !!onlineUsers?.[selectedChat] : false;

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-white">
      {/* Desktop Sidebar */}
      <Sidebar
        onSelect={onSelectChat}
        onOpenSettings={() => setSettingsOpen(true)}
        selectedChat={selectedChat}
        recentChats={recentChats}
        selfSummary={selfSummary}
        unreadCounts={unreadCounts}
      />

      {/* Chat Window */}
      <div className="flex-grow relative flex min-w-0">
        <ChatWindow
          selectedChat={selectedChat}
          messages={messages[selectedChat] || []}
          onSendMessage={onSendMessage}
          onSendReaction={onSendReaction}
          onLogout={onLogout}
          onSelectChat={onSelectChat}
          onStartCall={onStartCall}
          recentChats={recentChats}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          socketStatus={socketStatus}
          peerOnline={isPeerOnline}
        />

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <Sidebar
              onSelect={onSelectChat}
              onOpenSettings={() => setSettingsOpen(true)}
              selectedChat={selectedChat}
              recentChats={recentChats}
              selfSummary={selfSummary}
              unreadCounts={unreadCounts}
              isMobile
              onClose={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        selfSummary={selfSummary}
        onProfileUpdated={onProfileUpdated}
      />
    </div>
  );
};

export default ChatPage;
