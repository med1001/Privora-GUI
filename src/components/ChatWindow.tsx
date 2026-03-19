import React, { useState, useEffect, useRef } from "react";
import { Search, LogOut, Settings, Menu, MessageCircle, Wifi, WifiOff, Phone, Mic, Square, Send as SendIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";

import { MessageObj } from "../App";

interface UserSuggestion {
  userId: string;
  displayName: string;
}

interface RecentChat {
  userId: string;
  displayName: string;
}

interface ChatWindowProps {
  selectedChat: string;
  messages: MessageObj[];
  onSendMessage: (message: string, recipientUserId: string) => void;
  onLogout: () => void;
  onSelectChat: (chatId: string, displayName?: string) => void;
  onStartCall: (userId: string, displayName: string) => void;
  recentChats: RecentChat[];
  onToggleSidebar?: () => void; // For mobile drawer toggle
  isMobile?: boolean; // NEW: tell if mobile
  socketStatus?: string; // WebSocket connection status
  peerOnline?: boolean; // Whether the selected chat peer is online
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  onSendMessage,
  onLogout,
  onSelectChat,
  onStartCall,
  recentChats,
  onToggleSidebar,
  isMobile = false,
  socketStatus = "disconnected",
  peerOnline = false,
}) => {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false); // Track if message is being sent
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [clickedMessageIdx, setClickedMessageIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawDisplayName = localStorage.getItem("displayName") || "User";
  const displayName = (() => {
    const trimmed = rawDisplayName.trim();
    if (!trimmed) return "User";
    if (trimmed.includes("@")) {
      const localPart = trimmed.split("@")[0];
      const base = localPart.split("+")[0];
      return base || trimmed;
    }
    return trimmed;
  })();
  const userId = localStorage.getItem("userId");

  const rawSelectedName =
    recentChats.find((c) => c.userId === selectedChat)?.displayName ||
    selectedChat ||
    "No user selected";

  const selectedChatDisplayName = selectedChat === userId ? `${rawSelectedName} (me)` : rawSelectedName;

  // Read API base URL from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    onSelectChat(user.userId, user.displayName);
    setSearch("");
    setSuggestions([]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (selectedChat) {
            setSending(true);
            onSendMessage(`__system_audio:${base64Audio}`, selectedChat);
            setTimeout(() => setSending(false), 300);
          }
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required to send voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const send = () => {
    if (message.trim() && selectedChat) {
      setSending(true);
      onSendMessage(message, selectedChat);
      setMessage("");
      // Simulate send completion (in real app, you'd wait for confirmation)
      setTimeout(() => setSending(false), 300);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-blue-700 text-white p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1 rounded hover:bg-blue-600"
          >
            <Menu size={24} />
          </button>
          {selectedChat && (
            <span className="text-lg font-semibold truncate">
              {selectedChatDisplayName}
            </span>
          )}
        </div>

        {/* Connection Status Indicator & Call Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          {selectedChat && (
            <>
              {userId !== selectedChat && (
                <button
                  onClick={() => onStartCall(selectedChat, selectedChatDisplayName)}
                  disabled={!peerOnline}
                  className={`p-2 rounded-full transition-colors ${
                    peerOnline
                      ? "bg-green-500 hover:bg-green-600 shadow-md text-white"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed opacity-70"
                  }`}
                  title={peerOnline ? "Start Voice Call" : "User is Offline"}
                >
                  <Phone size={18} />
                </button>
              )}
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-white/80">
                <span
                  className={
                    "inline-block w-2 h-2 rounded-full " +
                    (peerOnline ? "bg-green-400" : "bg-gray-400")
                  }
                ></span>
                <span>{peerOnline ? "Online" : "Offline"}</span>
              </div>
            </>
          )}
        </div>

        {/* Desktop Search ONLY */}
        {!isMobile && (
          <div className="relative w-40 sm:w-64 hidden sm:block">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 pl-9 rounded-lg text-black border border-gray-300"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />

            {loading && !suggestions.length && (
              <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg p-2 text-center">
                <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="absolute top-12 left-0 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-y-auto z-20">
                {suggestions.map((user) => (
                  <div
                    key={user.userId}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSuggestionClick(user)}
                  >
                    <span className="text-black">
                      {user.displayName && user.displayName.includes("@")
                        ? (() => {
                            const localPart = user.displayName.split("@")[0];
                            const base = localPart.split("+")[0];
                            return base || user.displayName;
                          })()
                        : user.displayName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-10 h-10 bg-gray-300 text-black rounded-full flex items-center justify-center font-semibold"
              aria-label="Profile menu"
            >
              {(displayName.split(" ")[0][0] +
                (displayName.split(" ")[1]?.[0] || "")
              ).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white shadow-md rounded-lg p-2 w-40 z-30">
            <DropdownMenuItem onClick={() => alert("Settings clicked!")}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div
        className="flex-grow p-3 overflow-y-auto space-y-3 flex flex-col"
        ref={scrollRef}
      >
        {!selectedChat ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm font-medium">
                Select a user to start chatting
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === userId;
            
            // Format time safely and fix missing UTC timezone from backend
            const rawTs = msg.timestamp;
            const tsToParse = rawTs ? (rawTs.endsWith('Z') || rawTs.includes('+') ? rawTs : rawTs + 'Z') : undefined;
            const timeString = tsToParse ? new Date(tsToParse).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Now";

                          if (msg.text.startsWith("__system_call:")) {
                const parts = msg.text.split(":");
                let sysText = "Call information";
                if (parts[1] === "missed") {
                  sysText = isOwn ? "Call unanswered \u260E" : "Missed call \u260E";
                } else if (parts[1] === "ended") {
                  const minutes = parts[2] || "00";
                  const seconds = parts[3] || "00";
                  sysText = `Call ended \u260E Duration: ${minutes}:${seconds}`;
                }
                
                return (
                  <div key={idx} className="w-full flex flex-col items-center my-3 relative group cursor-pointer" onClick={() => setClickedMessageIdx(clickedMessageIdx === idx ? null : idx)}>
                    <div className="bg-gray-100 border border-gray-200 text-gray-500 text-xs py-1.5 px-4 rounded-full shadow-sm">
                      {sysText}
                    </div>
                    {clickedMessageIdx === idx && (
                      <div className="mt-1 text-[10px] text-gray-400 select-none animate-in fade-in slide-in-from-top-1">
                        {timeString}
                      </div>
                    )}
                  </div>
                );
              }

              if (msg.text.startsWith("__system_audio:")) {
                const audioBase64 = msg.text.replace("__system_audio:", "");
                return (
                  <div key={idx} className={`flex flex-col max-w-[75%] mb-1 ${isOwn ? "ml-auto items-end" : "mr-auto items-start"}`}>
                    <div onClick={() => setClickedMessageIdx(clickedMessageIdx === idx ? null : idx)} className={`py-2 px-3 rounded-xl shadow-sm relative group cursor-pointer transition-all ${isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-black rounded-bl-sm"}`}>
                      <audio controls src={audioBase64} className="h-10 w-48" />
                    </div>
                    {clickedMessageIdx === idx && (
                      <div className={`text-[11px] mt-1 px-1 select-none flex items-center opacity-70 animate-in fade-in slide-in-from-top-1 ${isOwn ? "text-gray-500 justify-end" : "text-gray-500 justify-start"}`}>
                        {timeString}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[75%] mb-1 ${
                    isOwn ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
              >
                <div
                  onClick={() => setClickedMessageIdx(clickedMessageIdx === idx ? null : idx)}
                  className={`py-2 px-3 rounded-xl shadow-sm relative group cursor-pointer transition-all ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-black rounded-bl-sm"
                  }`}
                >
                  <div className="text-[15px] leading-relaxed break-words">{msg.text}</div>
                </div>
                {clickedMessageIdx === idx && (
                  <div className={`text-[11px] mt-1 px-1 select-none flex items-center opacity-70 animate-in fade-in slide-in-from-top-1 ${
                    isOwn ? "text-gray-500 justify-end" : "text-gray-500 justify-start"
                  }`}>
                    {timeString}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t flex items-center gap-2">
        {/* Mic Button (Left side, only empty text & not recording) */}
        {(!message.trim() && !isRecording) && (
          <button
            onClick={startRecording}
            className="flex-shrink-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedChat || sending}
            title="Record Voice Message"
          >
            <Mic size={22} />
          </button>
        )}

        {isRecording ? (
          <div className="flex-grow min-w-0 h-11 px-4 border border-red-200 rounded-full bg-red-50 flex items-center justify-between text-red-500 font-medium">
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span>Recording...</span>
            </div>
            <button 
              onClick={stopRecording} 
              className="text-red-700 hover:bg-red-200 rounded-full p-1.5 transition-colors"
              title="Stop and Send"
            >
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        ) : (
          <input
            type="text"
            className="flex-grow min-w-0 h-11 px-4 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 transition-all bg-gray-50"
            placeholder={selectedChat ? "Message..." : "Select a user to start"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && message.trim() && send()}
            disabled={!selectedChat || sending}
          />
        )}
        
        {/* Send Button (Right side, disabled if empty text) */}
        {!isRecording && (
          <button
            onClick={send}
            className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-all text-white shadow-sm ${
              message.trim() && selectedChat && !sending
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-blue-300 cursor-not-allowed'
            }`}
            disabled={!selectedChat || sending || !message.trim()}
            title="Send Message"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SendIcon size={18} className="ml-1" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;






