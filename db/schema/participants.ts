import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { rooms } from "./rooms";

export const participants = pgTable("participants", {
  id: serial().primaryKey(),
  roomId: text()
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: text().notNull(),
  color: text().notNull(),
  joinedAt: timestamp({ withTimezone: true, mode: "string" })
    .default(sql`now()`)
    .notNull(),
});

export const participantRelations = relations(participants, ({ one }) => ({
  room: one(rooms, {
    fields: [participants.roomId],
    references: [rooms.id],
  }),
}));

export type Participant = InferSelectModel<typeof participants>;
