import { relations } from "drizzle-orm";
import { pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { rooms } from "./rooms";

export const emojiDrops = pgTable("emoji_drops", {
  id: uuid().primaryKey().defaultRandom(),
  roomId: text()
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: text().notNull(),
  emoji: text().notNull(),
  x: real().notNull(),
  y: real().notNull(),
  droppedAt: timestamp({ withTimezone: true, mode: "string" })
    .default(sql`now()`)
    .notNull(),
});

export const emojiDropRelations = relations(emojiDrops, ({ one }) => ({
  room: one(rooms, {
    fields: [emojiDrops.roomId],
    references: [rooms.id],
  }),
}));

export type EmojiDrop = InferSelectModel<typeof emojiDrops>;
