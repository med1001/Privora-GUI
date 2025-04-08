import { useEffect, useState } from "react";

const useWebSocket = (
  token: string | null,
  onMessageReceived: (message: string) => void
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");

  useEffect(() => {
    if (token) {
      const socketConnection = new WebSocket("ws://127.0.0.1:9000");

      socketConnection.onopen = () => {
        console.log("[WebSocket] Connected");
        setSocketStatus("connected");
      };

      socketConnection.onmessage = (event) => {
        console.log("[WebSocket] Received:", event.data);
        onMessageReceived(event.data);
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

  const sendMessage = (message: string, recipient: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: "message",
        to: recipient,
        message: message,
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
