import { useEffect, useState } from 'react';

const useWebSocket = (
  token: string | null,
  onMessageReceived: (message: string) => void
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketStatus, setSocketStatus] = useState('disconnected'); // Track WebSocket status

  useEffect(() => {
    if (token) {
      const socketConnection = new WebSocket('ws://127.0.0.1:8080');

      socketConnection.onopen = () => {
        console.log('[WebSocket] Connected');
        setSocketStatus('connected'); // Update status when connected
      };

      socketConnection.onmessage = (event) => {
        console.log('[WebSocket] Received:', event.data);
        onMessageReceived(event.data);
      };

      socketConnection.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.reason);
        setSocketStatus('disconnected'); // Update status when disconnected
        // Optionally, implement reconnection logic here
      };

      socketConnection.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setSocketStatus('error'); // Handle error state
      };

      setSocket(socketConnection);

      // Clean up WebSocket connection on component unmount or when token changes
      return () => {
        console.log('[WebSocket] Closing connection...');
        socketConnection.close();
      };
    }
  }, [token]);

  const sendMessage = (message: string, recipient?: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      let formatted = message;
      if (recipient) {
        formatted = `PRIVATE:${recipient}:${message}`;
      }
      console.log('[WebSocket] Sending:', formatted);
      socket.send(formatted);
    } else {
      console.log('[WebSocket] Connection not open. Status:', socketStatus);
    }
  };

  return { sendMessage, socketStatus }; // Expose socket status
};

export default useWebSocket;
