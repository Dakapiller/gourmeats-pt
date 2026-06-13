# Plano: Landing dinâmica Gourmeats + Backoffice Admin

## Fase 1 — Setup backend (Lovable Cloud)

Ativar Lovable Cloud (Supabase) e criar o schema:

**Auth & roles**
- `profiles` (id, email, full_name) — auto-criada via trigger no signup
- enum `app_role` ('admin', 'editor')
- `user_roles` (user_id, role) + função `has_role()` security-definer
- RLS: leitura pública nas tabelas de conteúdo; escrita só para `admin`

**Tabelas de conteúdo** (uma por secção da landing, todas com `id`, `updated_at`):
- `site_settings` (singleton: logo, contactos WhatsApp/email, og_image, meta title/description)
- `hero_section` (kicker, h1, subtítulo, CTA labels)
- `hero_stats` (ordem, valor, label) — inclui "+25% ticket médio"
- `proof_cards` (ordem, citação, nome, restaurante)
- `restaurants` (ordem, nome, logo_url, link, visible)
- `metrics` (ordem, valor, descrição)
- `features` (ordem, ícone, título, descrição)
- `demo_screens` (ordem, título, conteúdo JSON — para os 9 ecrãs)
- `faq_items` (ordem, pergunta, resposta)
- `cta_section` (título, subtítulo, labels)

Storage bucket público `assets` para logos/imagens.

## Fase 2 — Refactor da landing para React

Substituir o atual `dangerouslySetInnerHTML` por componentes React:
- `src/components/landing/` — um componente por secção (`Hero`, `HeroStats`, `Proof`, `Restaurants`, `Metrics`, `Features`, `DemoPhone`, `FAQ`, `CTA`, `Footer`, `Topbar`, `FabWhatsapp`)
- Mover CSS de `styles.css.txt` para `src/components/landing/landing.css` (importado uma vez), mantendo o design system existente (variáveis `--ink`, `--y`, etc.)
- Reescrever o demo interativo (9 ecrãs, selector idioma, vídeo, carrinho) como componente React com `useState`
- Aplicar nova versão do HTML (`index (30).html`) — adoptar ajustes de copy/layout
- Manter mobile-first com melhorias já planeadas (alinhamento assinaturas, métrica +25%, paddings mobile)

**Loading pattern** (canónico TanStack):
- `src/lib/landing.functions.ts` — server fns públicas (`getLandingContent()` agrega tudo num único call usando `supabaseAdmin` lido dentro do handler)
- `src/routes/index.tsx` — loader chama `ensureQueryData`, componente lê com `useSuspenseQuery`

## Fase 3 — SEO

- `head()` da rota `/` com title, description, og:*, twitter:*, canonical relativo `/`
- JSON-LD `Organization` + `LocalBusiness` (Gourmeats) em script no `head()`
- `public/robots.txt` permissivo + `public/sitemap.xml` com `/`
- Atributos `alt` em todas as imagens, headings semânticos (um H1, H2 por secção)
- `<html lang="pt">` no root shell
- Preload de fontes críticas, lazy loading de logos de restaurantes

## Fase 4 — Backoffice `/admin`

**Auth**
- `/auth` — login/signup email+password (sem Google por agora, conforme escolhido)
- Página `/reset-password`
- `src/routes/_authenticated/route.tsx` (gate gerido pela integração)
- Verificação adicional de role `admin` em `beforeLoad` do `_admin` layout; quem não for admin vê página "Sem acesso"

**Layout admin**
- `src/routes/_authenticated/_admin/admin.tsx` — sidebar com links para cada secção
- Uma rota por tabela editável:
  - `/admin/settings` — site_settings + contactos + SEO
  - `/admin/hero` — hero + stats (drag-reorder)
  - `/admin/proof` — depoimentos
  - `/admin/restaurants` — lista com upload de logo
  - `/admin/metrics`
  - `/admin/features`
  - `/admin/demo` — editor JSON estruturado por ecrã
  - `/admin/faq`
  - `/admin/cta`

Cada página usa shadcn `Table` + `Dialog` para CRUD, server fns autenticadas com `requireSupabaseAuth` + check `has_role(admin)`, invalidação da query `["landing"]` após save.

**Upload de imagens**: server fn que faz upload para storage `assets` e devolve URL pública.

## Fase 5 — Seed inicial

Migration com `INSERT` do conteúdo actual do `index (30).html` em todas as tabelas, para que a landing apareça igual no primeiro deploy.

## Detalhes técnicos

- **Cliente Supabase admin** carregado com `await import()` dentro de cada handler de server fn (regra do template).
- **`attachSupabaseAuth`** já configurado em `src/start.ts` (verificar).
- **Conversão de conversão**: CTAs WhatsApp com tracking via `data-cta` para futuro analytics; FAB WhatsApp visível em mobile com `aria-label`.
- **Performance**: imagens via `<img loading="lazy" decoding="async">`, fontes com `font-display: swap`.

## Fora de scope (para depois)
- Multi-idioma da landing (PT/EN/ES) no DB — fica preparado mas só PT no MVP
- Analytics dashboard no admin
- Versioning / rascunhos do conteúdo
