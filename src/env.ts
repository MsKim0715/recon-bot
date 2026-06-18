import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const EnvSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID : z.string().min(1),
  DATABASE_URL: z.string().min(1),
  HENRIK_API_KEY: z.string().optional(),
  WELCOME_CHANNEL_ID: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("환경변수 오류 :", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
