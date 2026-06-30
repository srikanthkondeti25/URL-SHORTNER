"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = exports.CreateLinkSchema = void 0;
const zod_1 = require("zod");
exports.CreateLinkSchema = zod_1.z.object({
    url: zod_1.z.string().url("Invalid URL").refine((val) => {
        try {
            const url = new URL(val);
            return ["http:", "https:"].includes(url.protocol);
        }
        catch {
            return false;
        }
    }, "Only HTTP/HTTPS URLs are allowed"),
    customAlias: zod_1.z.string().regex(/^[a-zA-Z0-9-_]*$/, "Alphanumeric, dashes and underscores only").optional(),
});
exports.LoginSchema = zod_1.z.object({
    password: zod_1.z.string().min(1, "Password is required"),
});
