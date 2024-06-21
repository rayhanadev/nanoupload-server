import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  link: text("link"),
});
