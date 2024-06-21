import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const texts = sqliteTable("texts", {
  id: text("id").primaryKey(),
  content: text("content"),
});
