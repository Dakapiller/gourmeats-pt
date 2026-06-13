# Plano: CTAs profissionais + nova paleta Gourmeats

## 1. Correções de copy (todos os CTAs revistos)

| Onde | Atual | Novo |
|---|---|---|
| Topbar | "Falar connosco" | "Falar com a equipa" |
| Hero | "Quero ter Gourmeats no meu restaurante" | "Pedir demonstração" |
| Demo — fim (s-cta, dentro do telemóvel) | "Falar com o **Andre**" | "Falar com o **André**" |
| Demo — fim (texto) | "Foi isto que viu. E a experiencia real dos seus clientes." | "Foi isto que viu — a experiência real dos seus clientes." |
| Demo CTA box (fora) | "Quer isto no seu restaurante?" / "Falar connosco agora" | "Pronto para oferecer esta experiência?" / "Agendar demonstração" |
| How-it-works | "Começar agora — falar com o André" | "Agendar demonstração com o André" |
| Final | "Falar com o André no WhatsApp" | "Falar com o André via WhatsApp" |
| Final email | "Prefere por e-mail? andre.duque@..." | "Prefere e-mail? andre.duque@..." |
| Mensagens pré-preenchidas WhatsApp | "Olá André, vi a landing..." / "vi a demo e quero a Gourmeats..." | Uniformizar: "Olá André, vi a apresentação da Gourmeats e gostaria de agendar uma demonstração para o meu restaurante." |
| FAB aria-label | "WhatsApp" | "Falar via WhatsApp" |

Sem alterações de funcionalidade, apenas texto + `href` (mensagens WA).

## 2. Nova paleta (baseada no logo)

Substituir o amarelo (`--y #F5C800`, `--yd`, `--ys`, gradientes amber, halos warm) por:

```text
--ink   : #1F1F1F   (grafite do "gourmeats" do logo)
--ink2  : #2E2E2E
--ink3  : #6B6B6B
--brand : #14B5A6   (teal do play-button do logo)
--brand-2: #0E8F84  (teal escuro — hover/gradient)
--brand-soft: #E6F7F5 (fundo suave, substitui --ys)
--brand-line: #BDE7E2 (border suave, substitui #F0D060)
--wa    : #25D366   (mantém — botões WhatsApp)
--wa-2  : #1FB755
```

Aplicação:
- `hero-kicker` ("DEMO ENERGY/CONCLUÍDA ✓"): fundo `--brand-soft`, texto `--brand-2`, border `--brand-line`. Sem gradiente amarelo.
- `demo-cta-box`: mesmo tratamento — fundo `--brand-soft` levíssimo, border `--brand-line`.
- Progress bar da demo (segmentos): ativos passam a `--brand`.
- Botão play da demo (`.ds-ctrl-play`): fundo `--brand`, hover `--brand-2`, ícone branco.
- `.ds-restart` ("Recomeçar a demo"): border `--brand`, sombra teal subtil.
- `.tap-hint`: border e glow em teal.
- `--grad-hero` / `--grad-warm` no hero: substituir por gradiente neutro (off-white → branco) com halo `radial-gradient(... rgba(20,181,166,.08), transparent)`. Sem amarelo de fundo.
- `--grad-amber` (usado em hovers): substituir por `linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)`.
- `cta-wa` (telemóvel) e `btn-wa` continuam **verde WhatsApp** — é cor de marca da app + sinal universal, mantém-se.
- FAB WhatsApp continua verde.

## 3. Ficheiros a tocar

- `src/landing/body.html` — copy de todos os CTAs e `wa.me` query strings; "Andre" → "André"; texto da `s-cta`.
- `src/landing/styles.css.txt` — variáveis `--y/--yd/--ys`, `--grad-warm`, `--grad-amber`, `hero-kicker`, `demo-cta-box`, `ds-ctrl-play`, `ds-restart`, `tap-hint`, `proof-card` hover, halo do hero, e qualquer `rgba(245,200,0,...)` → `rgba(20,181,166,...)`.
- `src/landing/script1.js` — só se houver cores inline (verificar barra de progresso/cursor); sem alterações de lógica.

## 4. Fora do âmbito

- Backoffice, schema, RLS, server functions, layout/estrutura, animações da demo.
- Cor verde WhatsApp dos botões WA (mantém-se).

## Notas técnicas

- Manter contraste AA: teal `#14B5A6` sobre branco passa para texto bold ≥14px; em corpo de texto pequeno usar `--brand-2 #0E8F84`.
- Todos os `box-shadow` com tinta amarela passam a teal com a mesma opacidade.
- Sem novas dependências; é trabalho puramente de tokens + copy.
