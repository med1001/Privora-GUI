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

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    onAuthErrorRef.current = onAuthError;
  }, [onAuthError]);

  useEffect(() => {
    if (token) {
      // Use environment variable or fallback to localhost
      const wsUrl =
      process.env.REACT_APP_WS_URL ||
      (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/ws";

      const socketConnection = new WebSocket(wsUrl);

      socketConnection.onopen = () => {
        console.log("[WebSocket] Connected");
        setSocketStatus("connected");

        const loginMessage = { type: "login", token };
        console.log("[WebSocket] Sending login message:", JSON.stringify(loginMessage));

        socketConnection.send(JSON.stringify(loginMessage));
      };

      socketConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);            console.log('[WebSocket] Received message type:', data.type, data);
          if (data.type === "message") {
            console.log(`[WebSocket] Message from ${data.from} to ${data.to}: ${data.message}`);
          } else {
            console.log("[WebSocket] Received non-message type:", data);
          }

          onMessageReceivedRef.current(data);
        } catch (err) {
          console.error("[WebSocket] Failed to parse incoming message:", event.data, err);
        }
      };

      socketConnection.onclose = (event) => {
        console.log("[WebSocket] Disconnected with code:", event.code, "reason:", event.reason);
        setSocketStatus("disconnected");

        // Code 1008 indicates policy violation (e.g. invalid/expired token).
        // Best practice: clear local state and prompt re-login.
        if (event.code === 1008) {
          if (onAuthErrorRef.current) {
            onAuthErrorRef.current();          }
        }
      };
      socketConnection.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setSocketStatus("error");
      };

      setSocket(socketConnection);

      return () => {
        console.log("[WebSocket] Closing connection...");
        socketConnection.close();
      };
    }
  }, [token]);

  const sendMessage = (message: string, recipientEmail: string, fromDisplayName: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: "message",
        to: recipientEmail,
        message,
        fromDisplayName,
      };

      console.log("[WebSocket] Sending:", payload);
      socket.send(JSON.stringify(payload));
    } else {
      console.log("[WebSocket] Connection not open. Status:", socketStatus);
    }
  };

  const sendRawMessage = (payload: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  return { sendMessage, sendRawMessage, socketStatus };
};

export default useWebSocket;
