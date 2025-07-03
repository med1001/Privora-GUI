import { useEffect, useState } from "react";

const useWebSocket = (
  token: string | null,
  onMessageReceived: (message: any) => void
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");

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
          const data = JSON.parse(event.data);

          if (data.type === "message") {
            console.log(`[WebSocket] Message from ${data.from} to ${data.to}: ${data.message}`);
          } else {
            console.log("[WebSocket] Received non-message type:", data);
          }

          onMessageReceived(data);
        } catch (err) {
          console.error("[WebSocket] Failed to parse incoming message:", event.data, err);
        }
      };

      socketConnection.onclose = (event) => {
        console.log("[WebSocket] Disconnected:", event.reason);
        setSocketStatus("disconnected");
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

  return { sendMessage, socketStatus };
};

export default useWebSocket;
