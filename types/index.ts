export type Cursor = { x: number; y: number; color: string };
export type EmojiDrop = {
  id: string;
  userId: string;
  emoji: string;
  x: number;
  y: number;
};
export type RoomInfo = {
  id: string;
  name: string;
  createdAt: string;
  owner: string;
};
export type Participant = { userId: string; color: string; joinedAt: string };
export interface ServerToClientEvents {
  cursor_move: (data: { userId: string; x: number; y: number }) => void;
  emoji_drop: (data: EmojiDrop) => void;
  user_join: (data: { userId: string; color: string }) => void;
  user_leave: (data: { userId: string }) => void;
}
export interface ClientToServerEvents {
  join_room: (roomId: string) => void;
  cursor_move: (data: { x: number; y: number }) => void;
  emoji_drop: (data: {
    emoji: string;
    x: number;
    y: number;
    id: string;
  }) => void;
}
