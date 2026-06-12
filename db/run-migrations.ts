import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main() {
  console.log("🔄 Running migrations...");

  const db = drizzle(process.env.DATABASE_URL!);

  await migrate(db, { migrationsFolder: "./db/migrations" });

  console.log("✅ Migrations complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
