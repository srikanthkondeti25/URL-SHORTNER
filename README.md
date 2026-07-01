# URL Shortener Project Report

## Executive Summary
This project is a modern, full-stack URL shortening service designed with performance, scalability, and developer experience in mind. It serves as a practical demonstration of building a production-ready application using a serverless edge architecture and a monorepo setup.

## Architecture & Tech Stack
The application is structured as an npm workspaces monorepo, clearly separating concerns while allowing for shared types and schemas across the stack.

### 1. Frontend (React + Vite)
- **Framework:** React with Vite for fast builds and optimized assets.
- **Styling:** Tailwind CSS v4 for utility-first, responsive design.
- **State & Forms:** `react-hook-form` and `zod` for robust form validation.
- **Features:** Clean UI for creating short links, custom alias support, and one-click copy with QR code generation (`qrcode.react`).

### 2. Backend (Hono + Cloudflare Workers)
- **Framework:** Hono, a lightweight web framework optimized for edge computing.
- **Runtime:** Cloudflare Workers, ensuring global, low-latency API responses.
- **Database:** Cloudflare D1 (Serverless SQLite) for persistent storage of links and custom aliases.
- **Caching:** Cloudflare KV used to invalidate and potentially cache short link resolutions for high read performance.
- **Security:** JWT-based authentication for administrative and management endpoints.

### 3. Shared Layer
- A dedicated `shared` package containing TypeScript interfaces and Zod schemas (e.g., `CreateLinkSchema`).
- Ensures type safety and validation consistency between the frontend client and backend API, minimizing integration bugs.

## Key Features
- **Instant URL Shortening:** Rapidly convert long URLs into compact, shareable links.
- **Custom Aliases:** Users can specify a preferred custom short code.
- **Management & Analytics:** Secured API endpoints to list, update, delete, and view basic analytics for shortened links.
- **Edge Deployment:** Leveraging the Cloudflare ecosystem allows the backend to run close to users globally, drastically reducing latency.

## Code Quality & Engineering Practices
- **Clean Architecture:** Strict separation of concerns (Frontend, Backend, Shared Types).
- **Type Safety:** End-to-end TypeScript enforcement guarantees reliable data contracts.
- **Validation:** Shared Zod schemas prevent malformed data at both the client boundary and server boundary.
- **Infrastructure as Code:** Handled via `wrangler.jsonc` for seamless local development, testing, and production deployment.
