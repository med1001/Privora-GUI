import { useEffect, useRef, useState } from "react";

const useWebSocket = (
  token: string | null,
  onMessageReceived: (message: any) => void,
  onAuthError?: () => void
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onAuthErrorRef = useRef(onAuthError);
  const attemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageBufferRef = useRef<any[]>([]);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    onAuthErrorRef.current = onAuthError;
  }, [onAuthError]);

  useEffect(() => {
    let socketConnection: WebSocket | null = null;
    let isMounted = true;

    const connectWebSocket = () => {
      if (!token || !isMounted) return;

      const wsUrl = process.env.REACT_APP_WS_URL || (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws";
      console.log(`[WebSocket] Connecting... attempt ${attemptRef.current}`);
      setSocketStatus(attemptRef.current > 0 ? "reconnecting" : "connecting");
      
      socketConnection = new WebSocket(wsUrl);

      socketConnection.onopen = () => {
        if (!isMounted) return;
        console.log("[WebSocket] Connected");
        setSocketStatus("connected");
        attemptRef.current = 0; // Reset attempts on successful connection

        const loginMessage = { type: "login", token };
        socketConnection?.send(JSON.stringify(loginMessage));

        // Flush message buffer
        if (messageBufferRef.current.length > 0) {
          console.log(`[WebSocket] Flushing ${messageBufferRef.current.length} buffered messages`);
          messageBufferRef.current.forEach((msg) => {
            socketConnection?.send(JSON.stringify(msg));
          });
          messageBufferRef.current = [];
        }

        // Setup ping interval to keep connection alive
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socketConnection && socketConnection.readyState === WebSocket.OPEN) {
            console.log("[WebSocket] Sending ping to keep connection alive...");
            socketConnection.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000); // 30 seconds
      };

      socketConnection.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          
          // Intercept pong message so it doesn't get processed by the rest of the application
          if (data.type === "pong") {
            console.log("[WebSocket] Received pong from server");
            return;
          }

          onMessageReceivedRef.current(data);
        } catch (err) {
          console.error("[WebSocket] Failed to parse incoming message:", event.data, err);
        }
      };

      socketConnection.onclose = (event) => {
        if (!isMounted) return;
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        console.log("[WebSocket] Disconnected with code:", event.code, "reason:", event.reason);
        setSocketStatus("disconnected");

        // Code 1008 indicates policy violation (e.g. invalid/expired token).
        // Best practice: clear local state and prompt re-login.
        if (event.code === 1008) {
          if (onAuthErrorRef.current) {
            onAuthErrorRef.current();
          }
          messageBufferRef.current = []; // Clear buffer on auth rejection
          return; // Do not reconnect if the token is permanently rejected      
        }

        // Auto-reconnect with exponential backoff for normal network drops     
        const timeout = Math.min(1000 * Math.pow(2, attemptRef.current), 30000); // Max 30s
        console.log(`[WebSocket] Reconnecting in ${timeout / 1000} seconds...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          attemptRef.current += 1;
          connectWebSocket();
        }, timeout);
      };

      socketConnection.onerror = (error) => {
        if (!isMounted) return;
        console.error("[WebSocket] Error:", error);
        setSocketStatus("error");
      };

      setSocket(socketConnection);
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (socketConnection) {
        console.log("[WebSocket] Closing connection via cleanup...");
        socketConnection.close();
      }
    };
  }, [token]);

  const sendMessage = (message: string, recipientEmail: string, fromDisplayName: string) => {
    const payload = { type: "message", to: recipientEmail, message, fromDisplayName };
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else {
      console.log("[WebSocket] Socket not ready, buffering message payload");
      messageBufferRef.current.push(payload);
    }
  };

  const sendRawMessage = (payload: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else {
      console.log("[WebSocket] Socket not ready, buffering raw payload:", payload.type);
      messageBufferRef.current.push(payload);
    }
  };

  return { sendMessage, sendRawMessage, socketStatus };
};

export default useWebSocket;
