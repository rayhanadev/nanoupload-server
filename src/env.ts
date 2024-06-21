import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_API_TOKEN: z.string(),
    CLOUDFLARE_EMAIL: z.string(),
    WRANGLER_SEND_METRICS: z.string().default("false"),
    CLOUDFLARE_API_BASE_URL: z.string(),
    WRANGLER_LOG: z.string().default("debug"),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
