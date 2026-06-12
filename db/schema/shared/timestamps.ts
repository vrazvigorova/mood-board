import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp({ withTimezone: true, mode: "string" })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).$onUpdate(() =>
    new Date().toISOString(),
  ),
} as const;
