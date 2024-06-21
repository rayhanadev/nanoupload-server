import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { customAlphabet } from "nanoid";

import { links } from "./db/models/links";
import { texts } from "./db/models/texts";
import { images } from "./db/models/images";
import { files } from "./db/models/files";

type Bindings = {
  BUCKET: R2Bucket;
  DB: D1Database & {
    client: DrizzleD1Database;
  };
};

const app = new Hono<{ Bindings: Bindings }>();
const nanoid = customAlphabet("6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz", 10);

app.use(async (c, next) => {
  c.env.DB.client = drizzle(c.env.DB);
  await next();
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/create", async (c) => {
  const { name, payload, type } = await c.req.json<{
    name: string;
    payload: string;
    type: string;
  }>();

  // TODO: validate parameters

  const id = nanoid();

  switch (type) {
    case "l":
      await c.env.DB.client.insert(links).values({
        id,
        link: payload,
      });
      break;
    case "t":
      await c.env.DB.client.insert(texts).values({
        id,
        content: payload,
      });
      break;
    case "i":
      // TODO: upload file to R2
      await c.env.DB.client.insert(images).values({
        id,
        slug: name,
      });
      break;
    case "f":
      // TODO: upload file to R2
      await c.env.DB.client.insert(files).values({
        id,
        slug: name,
      });
      break;
  }
});

app.get("/l/:id", (c) => {
  return c.text("WIP");
});

app.get("/t/:id", (c) => {
  return c.text("WIP");
});

app.get("/i/:id", (c) => {
  return c.text("WIP");
});

app.get("/f/:id", (c) => {
  return c.text("WIP");
});

export default app;
