import { useEffect, useState } from "react";

const useWebSocket = (
  token: string | null,
  onMessageReceived: (message: string) => void
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");

  useEffect(() => {
    if (token) {
      const socketConnection = new WebSocket("ws://127.0.0.1:8080");

      socketConnection.onopen = () => {
        console.log("[WebSocket] Connected");
        setSocketStatus("connected");

        // Add trace for login message
        const storedUsername = localStorage.getItem('username');
        console.log("[WebSocket] Username in localStorage:", storedUsername);
        const loginMessage = { type: "login", username: localStorage.getItem('username') };
        console.log("[WebSocket] Sending login message:", JSON.stringify(loginMessage));

        socketConnection.send(JSON.stringify(loginMessage)); // Send the login message
      };

      socketConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "message") {
            console.log(`[WebSocket] Message from ${data.from} to ${data.to}: ${data.message}`);
          } else {
            console.log("[WebSocket] Received non-message type:", data);
          }
      
          onMessageReceived(data); // Send parsed object instead of raw string
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

  const sendMessage = (message: string, recipient: string) => {
    const sender = localStorage.getItem("username"); // ⬅️ Get sender username
  
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: "message",
        from: sender,               // ⬅️ Include sender
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
