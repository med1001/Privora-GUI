import React, { useState } from "react";
import Sidebar from "./components/sidebar";
import ChatWindow from "./components/ChatWindow";

const initialMessages: { [key: string]: string[] } = {
  "Mohamed Ben Moussa": ["Bonjour, comment ça va ?"],
  "Alice Johnson": ["Hey, how's it going?"],
  "Project Team": ["Team meeting at 3 PM."],
  "David Smith": ["Hello!"],
  "Sarah Connor": ["We need to talk..."],
};

const App: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string>("Mohamed Ben Moussa");
  const [messages, setMessages] = useState<{ [key: string]: string[] }>(initialMessages);

  const sendMessage = (message: string) => {
    if (message.trim() !== "") {
      setMessages((prevMessages) => ({
        ...prevMessages,
        [selectedChat]: [...(prevMessages[selectedChat] || []), message],
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onSelect={setSelectedChat} selectedChat={selectedChat} />
      <ChatWindow 
        selectedChat={selectedChat} 
        messages={messages[selectedChat] || []} 
        onSendMessage={sendMessage} 
      />
    </div>
  );
};

export default App;
