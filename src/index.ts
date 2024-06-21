import { Hono } from "hono";

type Bindings = {};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/nano/create", (c) => {});

app.get("/l/:id", (c) => {
  // route for x content
});

app.get("/t/:id", (c) => {
  // route for x content
});

app.get("/i/:id", (c) => {
  // route for x content
});

app.get("/f/:id", (c) => {
  // route for x content
});

export default app;
