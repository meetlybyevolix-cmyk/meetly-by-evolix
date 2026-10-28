import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL || "mysql://localhost:3306/meetly";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
