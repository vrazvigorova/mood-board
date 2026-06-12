import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema/rooms";
import { participants } from "@/db/schema/participants";
import { emojiDrops } from "@/db/schema/emoji-drops";
import type { RoomInfo, Participant, EmojiDrop } from "@/types";
import { tryCatch } from "@/lib/try-catch";

export async function getRoomInfo(roomId: string): Promise<RoomInfo> {
  const [existing, fetchErr] = await tryCatch(
    db
      .select({
        id: rooms.id,
        name: rooms.name,
        owner: rooms.owner,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1),
  );

  if (fetchErr) throw new Error(`Failed to fetch room: ${fetchErr.message}`);

  if (existing[0]) return existing[0];

  const [created, createErr] = await tryCatch(
    db
      .insert(rooms)
      .values({
        id: roomId,
        name: `Room ${roomId.toUpperCase()}`,
        owner: "alex@toom.de",
      })
      .returning({
        id: rooms.id,
        name: rooms.name,
        owner: rooms.owner,
        createdAt: rooms.createdAt,
      }),
  );

  if (createErr) throw new Error(`Failed to create room: ${createErr.message}`);

  return created[0];
}

export async function getParticipants(roomId: string): Promise<Participant[]> {
  const [rows, error] = await tryCatch(
    db
      .select({
        userId: participants.userId,
        color: participants.color,
        joinedAt: participants.joinedAt,
      })
      .from(participants)
      .where(eq(participants.roomId, roomId)),
  );

  if (error) throw new Error(`Failed to fetch participants: ${error.message}`);

  return rows;
}

export async function getEmojiHistory(roomId: string): Promise<EmojiDrop[]> {
  const [rows, error] = await tryCatch(
    db
      .select({
        id: emojiDrops.id,
        userId: emojiDrops.userId,
        emoji: emojiDrops.emoji,
        x: emojiDrops.x,
        y: emojiDrops.y,
      })
      .from(emojiDrops)
      .where(eq(emojiDrops.roomId, roomId))
      .orderBy(desc(emojiDrops.droppedAt))
      .limit(20),
  );

  if (error) throw new Error(`Failed to fetch emoji history: ${error.message}`);

  return rows;
}
