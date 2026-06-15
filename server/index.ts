import { Server } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents } from "../types";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const randomUserId = () => "user-" + Math.random().toString(36).slice(2, 8);

// BUG: strict CORS with credentials — breaks in Docker
const io = new Server<ClientToServerEvents, ServerToClientEvents>(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true, // ← BUG: credentials:true requires exact origin match
  },
  allowEIO3: false, // ← BUG: rejects older Engine.IO clients
});

io.on("connection", (socket) => {
  const userId = randomUserId();
  const color = randomColor();
  let currentRoom: string | null = null;
  console.log(`[+] Connected: ${userId}`);
  socket.on("join_room", (roomId: string) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = roomId;
    socket.join(roomId);
    console.log(`[~] ${userId} joined room: ${roomId}`);
    io.to(roomId).emit("user_join", { userId, color });
    socket.on("cursor_move", ({ x, y }) => {
      socket.to(roomId).emit("cursor_move", { userId, x, y });
    });
    socket.on("emoji_drop", (data) => {
      io.to(roomId).emit("emoji_drop", { ...data, userId });
    });
  });
  socket.on("disconnect", () => {
    console.log(`[-] Disconnected: ${userId}`);
    if (currentRoom) io.to(currentRoom).emit("user_leave", { userId });
  });
});

console.log("🚀 Socket.IO server running on http://localhost:3001");
