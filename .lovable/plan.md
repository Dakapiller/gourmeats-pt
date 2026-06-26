# Plan

## 1. Landing — optimize section heights (mobile-first)

Goal: less vertical scrolling on mobile while keeping desktop spacing readable.

In `src/landing/styles.css.txt`:
- Reduce vertical padding of major sections (`section`, `.hero`, `.gallery-wrap`, `.logos`, `.faq`, `.cta`, `.metrics`, etc.) under the `max-width: 900px` and `max-width: 640px` media queries: ~30–40% tighter top/bottom padding.
- Reduce mobile heading/line-height (`h1`, `h2`, `.gallery-h`, `.hero-h`) and gaps between blocks (`gap`, `margin-bottom`) on mobile only.
- Shrink the gallery phone height on mobile (currently 200px width → tighter aspect), and reduce `.gallery-pts` gap to 6–8px on small screens.
- Cap hero illustration / proof / metrics min-heights on mobile so they don't stretch.

Desktop visuals stay essentially unchanged.

## 2. Gallery bug fix ("3 vistas")

Current bug: `goSlide(n)` translates `.gallery-track` by `-n*100%`, but `.gallery-track` lives inside a CSS grid column of unconstrained width, so the translate offset drifts and shows a blank/broken state when picking slide 2 or 3.

Fix in `src/landing/body.html` + `styles.css.txt`:
- Switch slide visibility from translate-based carousel to show/hide pattern: only `.gallery-slide.active` is rendered (`display:flex`), others `display:none`.
- Remove the `translateX` line from `goSlide()` and drop `overflow:hidden`/`min-width:100%` from `.gallery-track` (becomes a simple container).
- Keep nav tab toggling exactly as today — tabs remain clickable because slides no longer overflow their parent.

Result: clicking any of the 3 tabs swaps the slide cleanly; no horizontal drift.

## 3. Backoffice — Restaurants page workable

In `src/routes/_authenticated/admin/restaurants.tsx`:

**Layout / scroll**
- Wrap the page in a fixed-height shell: sticky top bar (title + search + filters + "Novo" button) and a scrollable list area (`max-h-[calc(100vh-220px)] overflow-y-auto`) instead of the whole page scrolling.
- Make each row more compact (smaller logo thumb, single line of meta) to fit more on screen.

**Search**
- Add a search input in the sticky top bar (icon inside the field). Client-side filter by `name` (case/diacritics insensitive).

**Filters** (chip toggles next to search)
- "Em destaque" (only featured)
- "Novos" (only `is_new`)
- "Sem URL" (only missing `link_url`)
- "Ocultos" (only `visible = false`)

**Sort**
- Dropdown "Ordenar por": `A–Z` (default), `Z–A`, `Mais recentes`, `Ordem manual`.
- Default ordering rule: featured first (by `featured_order`), then `is_new` items, then the rest A–Z. The manual reorder arrows stay available only when sort = "Ordem manual".

**Counters**
- Small header line: `X restaurantes · Y em destaque · Z sem URL`.

No DB schema changes required — all filtering/sorting happens client-side over the existing `restaurants` query.

## Technical notes
- Pure frontend changes. No migrations, no server functions touched.
- Files: `src/landing/body.html`, `src/landing/styles.css.txt`, `src/routes/_authenticated/admin/restaurants.tsx`.
