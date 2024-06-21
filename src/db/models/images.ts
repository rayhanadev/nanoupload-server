import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const images = sqliteTable("images", {
  id: text("id").primaryKey(),
  slug: text("slug"),
});
