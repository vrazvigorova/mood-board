import "dotenv/config";
import { type Config, defineConfig } from "drizzle-kit";

export const drizzleCasing = "snake_case" as const;

const isCi = process.env.CI === "true";

const config: Config = {
  out: "./db/migrations",
  schema: "./db/schema", // points to whole folder — picks up all files
  dialect: "postgresql",
  casing: drizzleCasing, // same value used in db/index.ts
};

if (!isCi) {
  // @ts-expect-error dbCredentials not always present
  config["dbCredentials"] = {
    url: process.env.DATABASE_URL!,
  };
}

export default defineConfig(config);
