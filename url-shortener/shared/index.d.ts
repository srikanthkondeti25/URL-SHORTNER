import { z } from "zod";
export declare const CreateLinkSchema: z.ZodObject<{
    url: z.ZodString;
    customAlias: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateLinkRequest = z.infer<typeof CreateLinkSchema>;
export declare const LoginSchema: z.ZodObject<{
    password: z.ZodString;
}, z.core.$strip>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export interface Link {
    id: number;
    short_code: string;
    original_url: string;
    custom_alias: string | null;
    created_at: string;
    updated_at: string;
    clicks: number;
    active: number;
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
