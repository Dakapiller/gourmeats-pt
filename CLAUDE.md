# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Portuguese B2B SaaS landing page + back-office for **Gourmeats** — a video menu product for restaurants, sold via QR code. The site targets restaurant owners in Portugal. The goal is to professionalise the site and turn it into an active lead generator.

## Stack

- **Runtime:** Bun
- **Framework:** TanStack Start (SSR) + TanStack Router (file-based routing)
- **UI:** React 19, Tailwind v4, shadcn/ui (Radix), lucide-react
- **Backend:** Supabase (auth + PostgreSQL + RLS)
- **Build:** Vite 8 via `@lovable.dev/vite-tanstack-config`
- **Deployment:** Cloudflare Workers (Nitro target, entry: `src/server.ts`)

## Commands

```bash
bun run dev        # local dev server
bun run build      # production build
bun run lint       # ESLint
bun run format     # Prettier (auto-fixes files)
```

No test suite exists — there are no unit or integration tests configured.

## Project structure

```
src/
  landing/                  # Static HTML template (body.html) + JS (script1.js) + CSS (styles.css.txt)
  routes/
    index.tsx               # Public landing page (renders landing HTML via dangerouslySetInnerHTML)
    auth.tsx                # Sign in / sign up / password reset tabs
    _authenticated/         # Protected layout — redirects to /auth if no session
      admin/                # Back-office (Hero, FAQ, Features, CTA, Restaurants, etc.)
  integrations/supabase/    # Browser client, SSR client, generated DB types
  lib/                      # Server functions (*.functions.ts), utilities
supabase/migrations/        # DB schema and migrations
```

The route tree is auto-generated into `src/routeTree.gen.ts` — never edit this file manually.

## How the landing page works

The landing page is a database-driven HTML template. `body.html` contains `%%PLACEHOLDER%%` tokens (e.g. `%%HERO_H1%%`, `%%LOGOS_ROW%%`). These are replaced at render time by `render-landing.functions.ts` using values fetched from Supabase. Back-office admins edit content via `/admin/*` routes, which updates the DB and thus the live site.

## Admin panel pattern

Every admin content section follows an identical pattern. Each admin route:
1. Defines a Zod schema for its form fields
2. Fetches data via TanStack Query `queryOptions`
3. Defines server functions in `src/lib/*.functions.ts` for CRUD
4. Renders the reusable `<SectionAdmin>` component (`src/components/admin/SectionAdmin.tsx`)

## Supabase integration

Two clients exist for different contexts:
- `src/integrations/supabase/client.ts` — browser client
- `src/integrations/supabase/client.server.ts` — SSR client for server functions

Middleware in `src/start.ts` attaches the user's bearer token to all server function calls. Generated TypeScript DB types live in `src/integrations/supabase/types.ts` — regenerate with `npx supabase gen types typescript` when the schema changes.

**DB schema key points:**
- **Singleton tables** (`site_settings`, `hero_section`, `cta_section`): always one row — use upsert, not insert.
- **List tables** (`hero_stats`, `proof_cards`, `restaurants`, `metrics`, `features`, `faq_items`): have `sort_order` and `is_visible` columns.
- **Authorization**: `user_roles` table with `app_role` enum (`admin | editor`). The `has_role(user_id, role)` PostgreSQL function is used in RLS policies.
- First signup automatically receives the `admin` role via a DB trigger.

## Key business context

- Product: video menus for restaurants, accessible via QR code
- Market: Portugal (PT copy throughout), expanding to Brazil/Angola
- CTA channel: WhatsApp (+351 916 082 384) — primary conversion channel
- 26+ active restaurants (Largo São Domingos, Duello, Kintsugi, Lado B, Tapabento, RO, etc.)
- Value props: 24 languages auto, ordering without staff, Google Reviews link, reservations link

## Current priorities (in order)

1. **Professionalise the visual design** — premium food-tech aesthetic. Not generic SaaS. Think: dark, editorial, high contrast, food photography, motion.
2. **Lead capture form** — email/name/restaurant capture as an alternative to WhatsApp. Leads → Supabase `leads` table AND HubSpot CRM via API.
3. **Analytics** — add Plausible or Vercel Analytics for conversion tracking.
4. **Fix broken assets** — logo references Lovable CDN URLs; move to `/public/` or Supabase Storage.
5. **Back-office improvements** — leads dashboard, restaurant management, analytics view.

## Design direction

- Dark background (`#0a0a0a` or deep charcoal)
- Accent: warm amber/gold (`#F59E0B` or similar)
- Typography: display face with personality (e.g. Fraunces, Playfair Display) paired with Inter for body
- The interactive phone demo is a key asset — keep and enhance it
- WhatsApp button stays prominent

## Environment variables

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=      # public anon key (also as VITE_SUPABASE_PUBLISHABLE_KEY)
SUPABASE_PROJECT_ID=           # (also as VITE_SUPABASE_PROJECT_ID)
SUPABASE_URL=                  # (also as VITE_SUPABASE_URL)
HUBSPOT_API_KEY=               # for lead sync (future)
```

The `.env` file is committed — it contains only public Supabase anon keys, not secrets.

## Conventions

- **Path alias**: `@/*` → `./src/*`
- **Prettier**: 100-char print width, double quotes, trailing commas everywhere, semicolons
- **Server functions**: live in `src/lib/*.functions.ts` using TanStack Start's `createServerFn()`
- **Shadcn components**: add via `bunx shadcn@latest add <component>` — they land in `src/components/ui/`
- Keep PT copy throughout (Portuguese-market product)
