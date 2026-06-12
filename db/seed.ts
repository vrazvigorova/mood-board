import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as roomsSchema from "./schema/rooms";
import * as participantsSchema from "./schema/participants";
import * as emojiSchema from "./schema/emoji-drops";

const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...roomsSchema, ...participantsSchema, ...emojiSchema },
  casing: "snake_case",
});

async function seed() {
  console.log("🌱 Seeding database...");

  await db
    .insert(roomsSchema.rooms)
    .values({
      id: "abc",
      name: "Room ABC",
      owner: "alex@toom.de",
    })
    .onConflictDoNothing();

  console.log("✓ Room created");

  await db
    .insert(participantsSchema.participants)
    .values([
      { roomId: "abc", userId: "user-1", color: "#FF6B6B" },
      { roomId: "abc", userId: "user-2", color: "#4ECDC4" },
      { roomId: "abc", userId: "user-3", color: "#45B7D1" },
    ])
    .onConflictDoNothing();

  console.log("✓ Participants created");

  const emojis = ["🔥", "⭐", "💡", "❤️", "🎉", "👀", "🚀"];
  await db
    .insert(emojiSchema.emojiDrops)
    .values(
      Array.from({ length: 8 }, (_, i) => ({
        roomId: "abc",
        userId: `user-${(i % 3) + 1}`,
        emoji: emojis[i % emojis.length],
        x: Math.random() * 800,
        y: Math.random() * 600,
      })),
    )
    .onConflictDoNothing();

  console.log("✓ Emoji history created");
  console.log("✅ Seed complete!");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
