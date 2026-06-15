"use client";
import { useEffect, useRef, useState } from "react";
import { useSocketIO } from "@/hooks/useSocketIO";
import { EmojiPicker } from "./EmojiPicker";
import { Cursor, EmojiDrop } from "@/types";
export function MoodBoard({ roomId }: { roomId: string }) {
  const { socketRef, isConnected } = useSocketIO(roomId);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [emojis, setEmojis] = useState<EmojiDrop[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState("🔥");
  const [userColors, setUserColors] = useState<Record<string, string>>({});
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const socket = socketRef.current; // read inside effect — this is correct
    if (!socket) return;

    socket.on("user_join", ({ userId, color }) => {
      setUserColors((prev) => ({ ...prev, [userId]: color }));
    });
    socket.on("user_leave", ({ userId }) => {
      setCursors((prev) => {
        const n = { ...prev };
        delete n[userId];
        return n;
      });
      setUserColors((prev) => {
        const n = { ...prev };
        delete n[userId];
        return n;
      });
    });
    socket.on("cursor_move", ({ userId, x, y }) => {
      setCursors((prev) => ({
        ...prev,
        [userId]: { x, y, color: userColors[userId] || "#ffffff" },
      }));
    });
    socket.on("emoji_drop", (data) => {
      setEmojis((prev) => [...prev, data]);
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => e.id !== data.id));
      }, 5000);
    });

    return () => {
      socket.off("user_join");
      socket.off("user_leave");
      socket.off("cursor_move");
      socket.off("emoji_drop");
    };
  }, [socketRef, userColors]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (throttleRef.current) return;
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null;
    }, 50);
    socketRef.current?.emit("cursor_move", { x: e.clientX, y: e.clientY });
  };
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-emoji-picker]")) return;
    socketRef.current?.emit("emoji_drop", {
      emoji: selectedEmoji,
      x: e.clientX,
      y: e.clientY,
      id: crypto.randomUUID(),
    });
  };
  return (
    <div
      className="fixed inset-0 bg-gray-950 cursor-crosshair overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <div data-emoji-picker>
        <EmojiPicker selected={selectedEmoji} onSelect={setSelectedEmoji} />
      </div>
      {!isConnected && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-900/80 text-red-200 text-sm px-4 py-2 rounded-full border border-red-700 backdrop-blur">
          ⚡ Reconnecting...
        </div>
      )}
      {isConnected && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Connected
        </div>
      )}
      <div className="fixed bottom-4 left-4 text-gray-600 text-xs pointer-events-none">
        Click anywhere to drop · Move mouse to share cursor
      </div>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="fixed pointer-events-none transition-all duration-75"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: "translate(-4px, -4px)",
          }}
        >
          <div
            className="w-3 h-3 rounded-full shadow-lg ring-2 ring-white/20"
            style={{ backgroundColor: cursor.color }}
          />
          <span
            className="absolute top-4 left-0 texs px-1.5 py-0.5 rounded-md text-white whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {userId}
          </span>
        </div>
      ))}
      {emojis.map((drop) => (
        <div
          key={drop.id}
          className="fixed pointer-events-none"
          style={{
            left: drop.x,
            top: drop.y,
            transform: "translate(-50%, -50%)",
            fontSize: "2rem",
            animation: "floatFade 5s ease-out forwards",
          }}
        >
          {drop.emoji}
        </div>
      ))}
      <style>{`@keyframes floatFade { 0% { opacity:1; transform:translate(-50%,-50%) scale(1); } 50% { opacity:0.8; transform:translate(-50%,-80%) scale(1.2); } 100% { opacity:0; transform:translate(-50%,-120%) scale(0.8); } }`}</style>
    </div>
  );
}
// cache test
