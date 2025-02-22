import { useState, useEffect, useRef } from 'react';

export default function useGameSocket(url: string) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // WS my beloved
  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    // Connected
    ws.onopen = () => {
      console.log("Connected to game server");
      setConnected(true);
    };

    // Disconnected
    ws.onclose = () => {
      console.log("Disconnected from game server");
      setConnected(false);
    };

    // Error
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { ws: wsRef.current, connected };
}
