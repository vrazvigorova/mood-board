import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/rooms";
import * as participantsSchema from "./schema/participants";
import * as emojiSchema from "./schema/emoji-drops";

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...schema, ...participantsSchema, ...emojiSchema },
  casing: "snake_case",
});
