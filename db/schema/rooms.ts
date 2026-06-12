import { relations } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { timestamps } from "./shared/timestamps";
import { participants } from "./participants";
import { emojiDrops } from "./emoji-drops";

export const rooms = pgTable("rooms", {
  id: text().primaryKey(),
  name: text().notNull(),
  owner: text().notNull(),
  ...timestamps,
});

export const roomRelations = relations(rooms, ({ many }) => ({
  participants: many(participants),
  emojiDrops: many(emojiDrops),
}));

export type Room = InferSelectModel<typeof rooms>;
