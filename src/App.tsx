import React, { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ChatPage from "./components/ChatPage"; //  IMPORT THE NEW FILE
import CallOverlay from "./components/CallOverlay";
import useWebSocket from "./hooks/useWebSockets";
import { useWebRTC } from "./hooks/useWebRTC";
import { useUnreadCounts } from "./hooks/useUnreadCounts";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "./firebase-config";

export interface MessageObj {
  msg_id: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: string;
  reactions?: { [userId: string]: string };
}

export interface UserSummary {
  userId: string;
  displayName: string;
  photoURL?: string | null;
  online?: boolean;
}

interface Messages {
  [userId: string]: MessageObj[];
}

// Helper to choose a display name: prefer the username set at signup (displayName),
// otherwise derive a readable name from the identifier (e.g. strip domain from emails).
const getDisplayName = (rawDisplayName: string | undefined | null, userId: string | null): string => {
  const normalize = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    // If the value looks like an email, use only the local part (before '+' / '@').
    if (trimmed.includes("@")) {
      const localPart = trimmed.split("@")[0];
      const base = localPart.split("+")[0];
      return base || trimmed;
    }

    return trimmed;
  };

  const fromRaw = normalize(rawDisplayName);
  if (fromRaw) return fromRaw;

  const fromId = normalize(userId);
  if (fromId) return fromId;

  return "";
};

const buildSelfSummary = (): UserSummary | null => {
  const userId = localStorage.getItem("userId");
  if (!userId) return null;

  return {
    userId,
    displayName: getDisplayName(localStorage.getItem("displayName"), userId),
    photoURL: localStorage.getItem("photoURL") || undefined,
    online: true,
  };
};

//  EXTRACT CHAT WRAPPER LOGIC OUT OF App FOR CLEANLINESS
const ChatWrapper: React.FC<{ onLogout: () => void; token: string }> = ({ onLogout, token }) => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Messages>({});
  const [recentChats, setRecentChats] = useState<UserSummary[]>([]);
  const [selfSummary, setSelfSummary] = useState<UserSummary | null>(() => buildSelfSummary());
  const [onlineUsers, setOnlineUsers] = useState<{ [userId: string]: boolean }>({});
  /** Latest presence map for WS handlers (avoids stale `onlineUsers` when history/contacts run after presence in another tab). */
  const onlineUsersRef = useRef<{ [userId: string]: boolean }>({});
  const { unreadCounts, incrementUnreadCount, resetUnreadCount } = useUnreadCounts();
  const playNotification = () => {
    try {
      const audio = new Audio('/assets/messenger.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {}
  };

  const localUserId = localStorage.getItem("userId");

  // Initialize with self-chat for notes on component mount
  useEffect(() => {
    if (selfSummary) {
      setRecentChats((prev) => {
        const filtered = prev.filter((c) => c.userId !== selfSummary.userId);
        return [
          selfSummary,
          ...filtered,
        ];
      });
    }
  }, [selfSummary]);

  const sendRawMessageRef = React.useRef<(payload: any) => void>(() => {});
  const sendWsMessageRef = React.useRef<(msg: string, to: string, displayName: string) => void>(() => {});

  const webRTC = useWebRTC(
    localUserId || "",
    token,
    (payload) => sendRawMessageRef.current(payload),
          (otherUserId: string, durationStr: string, missed: boolean, caller: boolean) => {
        let textMarker = "";
        if (missed) {
          textMarker = "__system_call:missed";
        } else {
          textMarker = `__system_call:ended:${durationStr}`;
        }

        if (caller) {
          try {
            const displayName = getDisplayName(localStorage.getItem("displayName"), localUserId);
            const msg_id = crypto.randomUUID();
            sendWsMessageRef.current(textMarker, otherUserId, displayName);
            setMessages((prev) => ({
              ...prev,
              [otherUserId]: [
                ...(prev[otherUserId] || []),
                {
                  msg_id: msg_id,
                  senderId: localUserId || "system",
                  senderName: displayName,
                  text: textMarker,
                  timestamp: new Date().toISOString(),
                  reactions: {}
                },
              ],
            }));
          } catch (e) {
            console.error("Failed", e);
          }
        }
      }
    );

  const { sendMessage: sendWsMessage, sendRawMessage, socketStatus } = useWebSocket(
    token, 
    (parsed: any) => {
      try {
        if (["call_offer", "call_answer", "ice_candidate", "call_reject", "call_end", "call_ring", "call_ring_offline", "call_accepting", "call_connected"].includes(parsed.type)) {
        webRTC.handleWebRTCSignal(parsed);
        return;
      }

      if (parsed.contacts && Array.isArray(parsed.contacts)) {
        setRecentChats((prev) => {
          // Build a map to deduplicate and always use latest displayName from backend
          const chatMap = new Map<string, UserSummary>();
          prev.forEach((c) => chatMap.set(c.userId, c));
          if (selfSummary) {
            chatMap.set(selfSummary.userId, selfSummary);
          }
          parsed.contacts.forEach((c: UserSummary) => {
            if (c.userId !== localUserId) {
              const prior = chatMap.get(c.userId);
              chatMap.set(c.userId, {
                userId: c.userId,
                displayName: getDisplayName(c.displayName, c.userId),
                photoURL: c.photoURL ?? prior?.photoURL,
                online:
                  onlineUsersRef.current[c.userId] ??
                  prior?.online ??
                  c.online ??
                  false,
              });
            }
          });
          return Array.from(chatMap.values());
        });
      } else if ((parsed.type === "message" || parsed.type === "offline") && parsed.from && parsed.message) {
        const { from, message, fromDisplayName, type, msg_id, reactions } = parsed;

        setMessages((prev) => ({
          ...prev,
            [from]: [...(prev[from] || []), { msg_id, senderId: from, senderName: fromDisplayName || from, text: message, timestamp: parsed.timestamp || new Date().toISOString(), reactions: reactions || {} }],
        }));

        setRecentChats((prev) => {
          const chatMap = new Map(prev.map((c) => [c.userId, c]));
          const existing = chatMap.get(from);
          chatMap.set(from, { 
            userId: from, 
            displayName: fromDisplayName || existing?.displayName || getDisplayName(undefined, from),
            photoURL: existing?.photoURL,
            online: existing?.online
          });
          return Array.from(chatMap.values());
        });

        if (type !== "offline" && !selectedChat && from !== localUserId) {
          // Auto-open standard incoming messages if nothing is opened
          setSelectedChat(from);
        } else if (from !== localUserId && selectedChat !== from) {
          // Add unread count for offline messages or if watching another chat
          incrementUnreadCount(from);
        }
          if (type === "message" && from !== localUserId && from !== selectedChat) {
            playNotification();
          }
      } else if (parsed.type === "reaction" && parsed.msg_id && parsed.from && parsed.reaction) {
        const { msg_id, from, reaction } = parsed;

        setMessages((prev) => {
          const next = { ...prev };
          // The reaction could be in any chat history, but typically it's between the current user and 'from'
          const chatKeys = Object.keys(next);
          for (const key of chatKeys) {
            next[key] = next[key].map(msg => {
              if (msg.msg_id === msg_id) {
                return {
                  ...msg,
                  reactions: {
                    ...(msg.reactions || {}),
                    [from]: reaction
                  }
                };
              }
              return msg;
            });
          }
          return next;
        });
      } else if (parsed.type === "history" && Array.isArray(parsed.messages)) {
          const historyByUser: { [userId: string]: MessageObj[] } = {};

          parsed.messages.forEach((msg: any) => {
            const otherUserId = msg.from === localUserId ? msg.to : msg.from;
            const senderLabel = msg.from === localUserId ? localUserId : (msg.fromDisplayName || msg.from);

            if (!historyByUser[otherUserId]) {
              historyByUser[otherUserId] = [];
            }
            historyByUser[otherUserId].push({ msg_id: msg.msg_id, senderId: msg.from, senderName: senderLabel, text: msg.message, timestamp: msg.timestamp || new Date().toISOString(), reactions: msg.reactions || {} });
        });

        setMessages((prev) => ({
          ...prev,
          ...historyByUser,
        }));

        setRecentChats((prev) => {
          const chatMap = new Map<string, UserSummary>();

          if (selfSummary) {
            chatMap.set(selfSummary.userId, selfSummary);
          }

          // Seed with existing entries for other users
          prev.forEach((c) => {
            if (c.userId !== localUserId) {
              chatMap.set(c.userId, c);
            }
          });

          // For each user that appears in history, update/insert entry
          Object.keys(historyByUser)
            .filter((userId) => userId !== localUserId)
            .forEach((userId) => {
              const existing = chatMap.get(userId);
              let displayName = existing?.displayName || "";

              // Prefer a message where that user is the sender with a fromDisplayName
              if (!displayName) {
                const fromMsg = parsed.messages.find(
                  (msg: any) => msg.from === userId && msg.fromDisplayName
                );
                if (fromMsg && fromMsg.fromDisplayName) {
                  displayName = fromMsg.fromDisplayName;
                }
              }

              // Fallback to userId if still empty
              if (!displayName) {
                displayName = getDisplayName(undefined, userId);
              }

              const currentlyOnline =
                onlineUsersRef.current[userId] ?? existing?.online ?? false;

              chatMap.set(userId, {
                userId,
                displayName,
                photoURL: existing?.photoURL,
                online: currentlyOnline,
              });
            });

          return Array.from(chatMap.values());
        });
      } else if (parsed.type === "presence" && parsed.userId && parsed.status) {
         
        const { userId, status } = parsed;
        const isOnline = status === "online";
        onlineUsersRef.current = { ...onlineUsersRef.current, [userId]: isOnline };

        setOnlineUsers((prev) => ({
          ...prev,
          [userId]: isOnline,
        }));

        setRecentChats((prev) =>
          prev.map((c) =>
            c.userId === userId
              ? {
                  ...c,
                  online: status === "online",
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Invalid WebSocket JSON:", parsed, err);
    }
  }, onLogout);

  useEffect(() => {
    sendWsMessageRef.current = sendWsMessage;
  }, [sendWsMessage]);

  useEffect(() => {
    sendRawMessageRef.current = sendRawMessage;
  }, [sendRawMessage]);

  const handleSelectChat = (userId: string, displayName?: string, photoURL?: string | null) => {
    setSelectedChat(userId);
    resetUnreadCount(userId);

    setRecentChats((prev) => {
      const selfChat = selfSummary ? [selfSummary] : [];
      const others = prev.filter((c) => c.userId !== localUserId && c.userId !== userId);
      if (userId !== localUserId) {
        return [
          ...selfChat,
          {
            userId,
            displayName: getDisplayName(displayName, userId),
            photoURL: photoURL || prev.find((c) => c.userId === userId)?.photoURL,
            online: onlineUsers[userId] ?? false,
          },
          ...others,
        ];
      }
      return [...selfChat, ...others];
    });
  };

  const handleProfileUpdated = useCallback((updatedProfile: Pick<UserSummary, "displayName" | "photoURL">) => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return;

    localStorage.setItem("displayName", updatedProfile.displayName);
    if (updatedProfile.photoURL) {
      localStorage.setItem("photoURL", updatedProfile.photoURL);
    } else {
      localStorage.removeItem("photoURL");
    }

    const nextSelfSummary: UserSummary = {
      userId: currentUserId,
      displayName: updatedProfile.displayName,
      photoURL: updatedProfile.photoURL,
      online: true,
    };

    setSelfSummary(nextSelfSummary);
    setRecentChats((prev) => {
      const others = prev.filter((c) => c.userId !== currentUserId);
      return [nextSelfSummary, ...others];
    });
  }, []);

  const sendMessage = (message: string, recipientUserId: string) => {
    if (message.trim() !== "" && recipientUserId && localUserId) {
      const displayName = getDisplayName(localStorage.getItem("displayName"), localUserId);
      const msg_id = crypto.randomUUID();
      
      if (recipientUserId !== localUserId) {
        setMessages((prev) => ({
          ...prev,
          [recipientUserId]: [
            ...(prev[recipientUserId] || []),
            { msg_id, senderId: localUserId, senderName: displayName, text: message, timestamp: new Date().toISOString(), reactions: {} },
          ],
        }));
      }

      sendRawMessage({ type: "message", msg_id, to: recipientUserId, message, fromDisplayName: displayName });
    }
  };

  const sendReaction = (msg_id: string, reaction: string, recipientUserId: string) => {
    if (msg_id && reaction && recipientUserId && localUserId) {
      // Optimistically update local state for self reaction
      setMessages((prev) => {
        const next = { ...prev };
        if (next[recipientUserId]) {
          next[recipientUserId] = next[recipientUserId].map(msg => {
            if (msg.msg_id === msg_id) {
              return {
                ...msg,
                reactions: {
                  ...(msg.reactions || {}),
                  [localUserId]: reaction
                }
              };
            }
            return msg;
          });
        }
        return next;
      });

      // Send to the backend using type "reaction"
      sendRawMessage({ type: "reaction", msg_id, to: recipientUserId, reaction });
    }
  };

  return (
    <>
      <ChatPage
        selectedChat={selectedChat}
        recentChats={recentChats}
        unreadCounts={unreadCounts}
        messages={messages}
        onSendMessage={sendMessage}
        onSendReaction={sendReaction}
        onLogout={onLogout}
        onSelectChat={handleSelectChat}
        onStartCall={webRTC.initiateCall}
        socketStatus={socketStatus}
        onlineUsers={onlineUsers}
        selfSummary={selfSummary}
        onProfileUpdated={handleProfileUpdated}
      />
      <CallOverlay
        callState={webRTC.callState}
        remoteStream={webRTC.remoteStream}
        isMuted={webRTC.isMuted}
        onToggleMute={webRTC.toggleMute}
        onAccept={webRTC.acceptCall}
        onReject={() => webRTC.rejectCall()}
        onHangup={() => webRTC.endCall()}
      />
    </>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Firebase automatically handles session storage and keep-alive refresh tokens
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          const freshToken = await user.getIdToken();
          localStorage.setItem("userId", user.email || user.uid);
          localStorage.setItem("displayName", user.displayName || user.email || "");
          if (user.photoURL) {
            localStorage.setItem("photoURL", user.photoURL);
          } else {
            localStorage.removeItem("photoURL");
          }
          setToken(freshToken);
          setIsAuthenticated(true);
        } catch (err) {
          // If token fetch fails, force logout
          setToken(null);
          setIsAuthenticated(false);
          localStorage.clear();
        }
      } else {
        setToken(null);
        setIsAuthenticated(false);
        localStorage.clear();
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (newToken: string) => {
    // Firebase onIdTokenChanged will automatically pick up the login,
    // but giving direct feedback helps in case of delays.
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.clear();
    setIsAuthenticated(false);
    setToken(null);
    navigate("/login");
  };

  if (authLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#f9fafb]">Log into Privora...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/chat" /> : <Login onLogin={login} />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/chat" /> : <Register />} />
      <Route
        path="/chat"
        element={isAuthenticated && token ? <ChatWrapper onLogout={logout} token={token} /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} />
    </Routes>
  );
};

export default App;


















