import { z } from "zod";

export const CreateLinkSchema = z.object({
  url: z.string().url("Invalid URL").refine((val) => {
    try {
      const url = new URL(val);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  }, "Only HTTP/HTTPS URLs are allowed"),
  customAlias: z.string().regex(/^[a-zA-Z0-9-_]*$/, "Alphanumeric, dashes and underscores only").optional(),
});

export type CreateLinkRequest = z.infer<typeof CreateLinkSchema>;

export const LoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof LoginSchema>;

export interface Link {
  id: number;
  short_code: string;
  original_url: string;
  custom_alias: string | null;
  created_at: string;
  updated_at: string;
  clicks: number;
  active: number; // 0 or 1 for SQLite boolean
  expires_at: string | null;
}

export interface AnalyticsRecord {
  id: number;
  link_id: number;
  timestamp: string;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
}
