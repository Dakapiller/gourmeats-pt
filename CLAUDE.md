# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gourmeats is a Portuguese SaaS platform that helps restaurants create video-based digital menus accessible via QR codes. It consists of a public landing page (fully server-rendered from database content) and an authenticated admin backoffice for managing that content.

## Commands

```bash
# Development
bun run dev           # Start dev server
bun run build         # Production build (targets Cloudflare Workers)
bun run build:dev     # Development build
bun run preview       # Preview production build locally

# Code quality
bun run lint          # ESLint
bun run format        # Prettier (auto-fixes files)
```

**No test suite exists** — there are no unit or integration tests configured.

## Architecture

### Stack
- **Framework**: TanStack Start (SSR) + TanStack Router (file-based) + React 19
- **Bundler**: Vite 8 via `@lovable.dev/vite-tanstack-config`
- **Runtime**: Cloudflare Workers (Nitro target, entry: `src/server.ts`)
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **UI**: Shadcn UI (New York style) + Radix UI + Tailwind CSS 4
- **Data fetching**: TanStack Query + TanStack Start server functions
- **Package manager**: Bun

### Route Structure (`src/routes/`)

File-based routing via TanStack Router. The route tree is auto-generated into `src/routeTree.gen.ts` — never edit this file manually.

```
/                        → index.tsx (public landing page, SSR-rendered from DB)
/auth                    → auth.tsx (sign in / sign up / password reset tabs)
/reset-password          → reset-password.tsx
/sitemap.xml             → sitemap[.]xml.ts (XML sitemap server route)
/_authenticated/         → Protected layout (redirects to /auth if no session)
/_authenticated/admin/   → Admin panel layout with sidebar nav
/_authenticated/admin/*  → One route per content section (hero, faq, features, etc.)
```

The `_authenticated/route.tsx` guard checks for a Supabase session on load; `_authenticated/admin/route.tsx` additionally verifies the `admin` role in `user_roles`.

### Landing Page Rendering

The public landing page is **not a normal React page**. `src/routes/index.tsx` calls the `getRenderedLanding()` server function (`src/lib/render-landing.functions.ts`), which fetches all content from Supabase, injects it into an HTML template (`src/landing/body.html`), and returns the full HTML string. This string is rendered via `dangerouslySetInnerHTML`. CSS (`src/landing/styles.css.txt`) and JS (`src/landing/script1.js`) are inlined.

### Admin Panel Pattern

Every admin content section follows an identical pattern using the reusable `SectionAdmin` component (`src/components/admin/SectionAdmin.tsx`). Each admin route (`src/routes/_authenticated/admin/*.tsx`) typically:
1. Defines a Zod schema for its form
2. Fetches data via a TanStack Query `queryOptions`
3. Defines server functions (in `src/lib/*.functions.ts` files) for CRUD operations
4. Renders `<SectionAdmin>` with columns, form fields, and mutation callbacks

### Supabase Integration

Two Supabase clients exist for different contexts:
- `src/integrations/supabase/client.ts` — browser client (uses `VITE_SUPABASE_*` env vars)
- `src/integrations/supabase/client.server.ts` — SSR client for server functions

Middleware in `src/start.ts` attaches the user's bearer token to all server function calls. Generated TypeScript types for the database live in `src/integrations/supabase/types.ts` — regenerate with `npx supabase gen types typescript` when the schema changes.

### Database Schema Key Points

- **Singleton tables**: `site_settings`, `hero_section`, `cta_section` — always have exactly one row; use upsert.
- **List tables**: `hero_stats`, `proof_cards`, `restaurants`, `metrics`, `features`, `faq_items` — have `sort_order` and `is_visible` columns.
- **Authorization**: `user_roles` table with `app_role` enum (`admin | editor`). Check permissions with the `has_role(user_id, role)` PostgreSQL function. RLS policies enforce this at the DB level.
- **First signup** automatically receives the `admin` role (enforced via a DB trigger).
- Migrations live in `supabase/migrations/`.

## Key Conventions

- **Path alias**: `@/*` maps to `./src/*`
- **Prettier**: 100-char print width, double quotes, trailing commas everywhere, semicolons
- **Server functions**: Named with `.functions.ts` suffix in `src/lib/`. Use TanStack Start's `createServerFn()`.
- **Environment variables**: Supabase keys are prefixed `VITE_SUPABASE_*` for client-side access and `SUPABASE_*` for server-side. The `.env` file is committed (contains public Supabase anon keys only — not secrets).
- **Shadcn components**: Added via `bunx shadcn@latest add <component>` — they land in `src/components/ui/`.
