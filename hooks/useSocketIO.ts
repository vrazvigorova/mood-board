"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "@/types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocketIO(roomId: string) {
  const socketRef = useRef<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket: AppSocket = io("http://localhost:3001", {
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_room", roomId);
    });

    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  // Return the ref itself, not ref.current
  // Consumers access socketRef.current inside effects/handlers — never during render
  return { socketRef, isConnected };
}
