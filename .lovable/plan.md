# Importar restaurantes ativos + destaques

## 1. Schema (migração)
Adicionar à tabela `restaurants`:
- `featured boolean not null default false` — marca destaque na landing
- `featured_order integer` — ordem entre destacados (nullable)

Trigger ou validação no backoffice impede ter mais de 5 com `featured=true` (a constraint dura via partial unique index não dá; usamos validação UI + um trigger `BEFORE INSERT/UPDATE` que conta e rejeita acima de 5).

## 2. Seed dos 26 ativos
Insert dos 26 restaurantes com `Status=Active` do ficheiro, mapeando:
- `name` ← Name
- `link_url` ← URL (NULL quando em falta)
- `visible=true`, `sort_order` pela ordem cronológica de ativação
- `logo_url=NULL` (a preencher depois no backoffice)

Restaurante "Seixo by Vasco Coelho Santos" (Churn) é excluído.

**Sem URL gourmeats (5):** Botequim Nostalgic, O Buraquinho, Bulha Bolhão, Kintsugi, Soul Bites.

## 3. Backoffice (`/admin/restaurants`)
- Novo campo `featured` (switch) + `featured_order` (number).
- **Aviso visível** em cada card sem `link_url`: badge "Sem URL Gourmeats — adicionar" (amber).
- Banner no topo a contar quantos restaurantes faltam URL e quantos destaques estão definidos (`x/5`).
- Bloquear ativar 6.º destaque (toast + revert).

## 4. Landing
Na secção de logos:
- Mostrar primeiro os `featured=true` (ordenados por `featured_order`, depois `sort_order`).
- Os restantes ficam escondidos atrás de um botão **"Ver todos os restaurantes (21)"** que faz toggle (CSS `.logos-extra.is-open`) — sem nova rota, sem JS pesado.
- Se 0 destacados, mostra tudo (fallback).

`render-landing.functions.ts` passa a query a incluir `featured, featured_order` e divide em dois grupos no HTML gerado (`%%LOGOS_ROW%%` + novo `%%LOGOS_EXTRA%%` + botão).

## 5. Fora de scope
- Logos das marcas (ficam a NULL, placeholder por nome — já existente).
- Alterações ao resto da landing/CTA/copy.

## Ficheiros a tocar
- Migração SQL (nova) — colunas + trigger.
- Seed via insert tool — 26 linhas.
- `src/routes/_authenticated/admin/restaurants.tsx` — campos + avisos.
- `src/components/admin/SectionAdmin.tsx` — só se preciso para suportar `boolean`/`number` (verificar).
- `src/lib/render-landing.functions.ts` — query + split + token.
- `src/landing/body.html` — novo bloco `%%LOGOS_EXTRA%%` + botão toggle.
- `src/landing/styles.css.txt` — estilos do toggle/extra.
