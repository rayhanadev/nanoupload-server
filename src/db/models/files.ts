import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  slug: text("slug"),
});
