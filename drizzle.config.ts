import { defineConfig } from "drizzle-kit";

import { env } from "./src/env";

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./src/db/models/*",
  out: "./migrations",
  dbCredentials: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    databaseId:
      env.NODE_ENV === "development"
        ? "6b52e13a-20be-4c19-8c09-74342bc2056d"
        : "e32628bc-dae9-4df9-95c9-79b692d1da40",
    token: env.CLOUDFLARE_API_TOKEN,
  },
  migrations: {
    table: "migrations",
  },
});
