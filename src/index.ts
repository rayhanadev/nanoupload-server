import { eq } from "drizzle-orm";
import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { customAlphabet } from "nanoid";

import { links } from "./db/models/links";
import { texts } from "./db/models/texts";

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

app.post("/upload", async (c) => {
  const { file, type, ext } = await c.req.parseBody<{
    type: string;
    file: File;
    ext?: string;
  }>();

  // TODO: validate
  // TODO: validate file type

  const id = nanoid();

  switch (type) {
    case "i":
      await c.env.BUCKET.put(`images/${id}${ext}`, file);
      break;
    case "f":
      await c.env.BUCKET.put(`files/${id}${ext}`, file);
      break;
  }

  return c.json({
    id,
    url: `/${type}/${id}${ext}`,
  });
});

app.post("/create", async (c) => {
  const { payload, type } = await c.req.json<{
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
  }

  return c.json({
    id,
    url: `/${type}/${id}`,
  });
});

app.get("/l/:id", async (c) => {
  const { id } = c.req.param();
  const link = await c.env.DB.client
    .select()
    .from(links)
    .where(eq(links.id, id))
    .execute();

  if (link.length === 0) {
    return c.text("Not Found", 404);
  }

  if (!link[0].link) {
    return c.text("Internal Server Error", 500);
  }

  return c.redirect(link[0].link);
});

app.get("/t/:id", async (c) => {
  const { id } = c.req.param();
  const text = await c.env.DB.client
    .select()
    .from(texts)
    .where(eq(texts.id, id))
    .execute();

  if (text.length === 0) {
    return c.text("Not Found", 404);
  }

  if (!text[0].content) {
    return c.text("Internal Server Error", 500);
  }

  return c.text(text[0].content);
});

app.get("/i/:filename", async (c) => {
  const { filename } = c.req.param();
  const image = await c.env.BUCKET.get(`images/${filename}`);

  if (!image) {
    return c.text("Not Found", 404);
  }

  const headers = new Headers();
  image.writeHttpMetadata(headers);
  headers.set("etag", image.httpEtag);

  return new Response(image.body, {
    headers,
  });
});

app.get("/f/:filename", async (c) => {
  const { filename } = c.req.param();
  const file = await c.env.BUCKET.get(`files/${filename}`);

  if (!file) {
    return c.text("Not Found", 404);
  }

  const headers = new Headers();
  file.writeHttpMetadata(headers);
  headers.set("etag", file.httpEtag);

  return new Response(file.body, {
    headers,
  });
});

export default app;
