import { eq } from "drizzle-orm";
import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { customAlphabet } from "nanoid";
import { z } from "zod";

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

const uploadSchema = z.object({
  type: z.enum(["i", "f"]),
  file: z.instanceof(File),
  ext: z.string().optional(),
});

type UploadSchemaType = z.infer<typeof uploadSchema>;

app.post("/upload", async (c) => {
  try {
    const { file, type, ext } = await c.req.parseBody<UploadSchemaType>();

    const validationResult = uploadSchema.safeParse({ type, file, ext });

    if (!validationResult.success) {
      console.error(validationResult.error.flatten().fieldErrors);
      return c.text("Bad Request", 400);
    }

    const id = nanoid();

    switch (type) {
      case "i":
        await c.env.BUCKET.put(`images/${id}${ext}`, await file.arrayBuffer());
        break;
      case "f":
        await c.env.BUCKET.put(`files/${id}${ext}`, await file.arrayBuffer());
        break;
    }

    return c.json({
      id,
      url: `/${type}/${id}${ext}`,
    });
  } catch (error: any) {
    console.error(error);
    return c.text("Internal Server Error", 500);
  }
});

const createSchema = z.object({
  payload: z.string(),
  type: z.enum(["l", "t"]),
});

type CreateSchemaType = z.infer<typeof createSchema>;

app.post("/create", async (c) => {
  try {
    const { payload, type } = await c.req.json<CreateSchemaType>();

    const validationResult = createSchema.safeParse({ type, payload });

    if (!validationResult.success) {
      console.error(validationResult.error.flatten().fieldErrors);
      return c.text("Bad Request", 400);
    }

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
  } catch (error: any) {
    console.error(error);
    return c.text("Internal Server Error", 500);
  }
});

app.get("/l/:id", async (c) => {
  try {
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
      console.error("Link not found in database for id:", id);
      return c.text("Internal Server Error", 500);
    }

    return c.redirect(link[0].link);
  } catch (error: any) {
    console.error(error);
    return c.text("Internal Server Error", 500);
  }
});

app.get("/t/:id", async (c) => {
  try {
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
      console.error("Text not found in database for id:", id);
      return c.text("Internal Server Error", 500);
    }

    return c.text(text[0].content);
  } catch (error: any) {
    console.error(error);
    return c.text("Internal Server Error", 500);
  }
});

app.get("/i/:filename", async (c) => {
  try {
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
  } catch (error: any) {
    console.error(error);
    return c.text("Internal Server Error", 500);
  }
});

app.get("/f/:filename", async (c) => {
  try {
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
  } catch (error: any) {
    console.error(error);
    return c.text("Internal Server Error", 500);
  }
});

export default app;
