# Live Demo Controlada + Revisão Premium UI/UX

## Parte 1 — Demo "live controlada"

Transformar a secção `#demo` num percurso cinematográfico com cursor automático e intervenção opcional.

**Comportamento**
- Auto-play arranca quando a demo entra no viewport (já existe).
- Um **cursor falso** animado aparece no telemóvel e desloca-se suavemente até ao alvo de cada passo (bandeira, botão Add, item do menu, "Chamar empregado", etc.), com um "tap pulse" no momento da ação.
- O alvo do passo recebe um **glow/ring pulsante** sincronizado com a chegada do cursor.
- **Barra de progresso clicável** por cima do telemóvel: cada passo é um segmento, com label curta no hover, salto direto ao clicar.
- **Controlos visíveis** discretos por baixo: ⏮ Anterior · ⏯ Play/Pause · ⏭ Próximo · ↺ Recomeçar. Estado atual ("3 / 9 · a avançar automaticamente" ou "controlo manual") fica visível.
- Se o utilizador tocar no ecrã do telemóvel ou usar os controlos manuais → muda para `manualMode`, cursor falso desaparece, indicador passa a "controlo manual" com botão "Retomar auto".
- No último passo, cursor desaparece, aparece CTA WhatsApp + botão "Ver outra vez".
- Tempo por passo ajustado: 4.5s (legível, não apressado). Transições suaves entre painéis com fade+slide curto.

**Acessibilidade / performance**
- Pausa auto se `prefers-reduced-motion` (sem cursor animado, transições simples).
- Pausa se a aba perde foco ou se o utilizador faz scroll para fora.
- Cursor é puro DOM (div + CSS transform), sem libs extras.

## Parte 2 — Revisão Premium UI/UX (look & feel)

Passagem global de polimento, sem alterar copy nem estrutura de conteúdo.

**Design system (`src/styles.css`)**
- Refinar paleta semântica: fundo `#0B0B0C` quase preto, superfícies com gradiente subtil, primário dourado/âmbar quente (mantendo a identidade Gourmeats), texto com hierarquia em 3 níveis de opacidade.
- Tipografia: heading display (ex.: Fraunces ou Instrument Serif) + sans neutro (Inter/Geist) para corpo. Tracking apertado nos H1/H2, line-height generoso no corpo.
- Tokens novos: `--gradient-hero`, `--gradient-surface`, `--shadow-elegant`, `--shadow-glow`, `--radius-xl`, transições `--ease-out-expo`.
- Animações reutilizáveis: `fade-in-up`, `reveal-on-scroll` (IntersectionObserver), `shimmer` para realces.

**Hero**
- Eyebrow + headline maior com kerning premium, sub-headline em tom mais baixo.
- Mockup do telemóvel com sombra suave + leve glow âmbar, frame mais limpo.
- CTA principal com micro-interação (hover lift + shimmer subtil).
- Indicador de scroll discreto.

**Secções**
- Espaçamento vertical consistente (clamp responsivo), divisores subtis em vez de linhas duras.
- Cartões (galeria, "como funciona", pricing): bordas 1px com gradiente, hover lift + ring âmbar, radius generoso.
- Galeria de telemóveis: alinhamento, sombras uniformes, legendas em caps tracking largo.
- "Como funciona" (steps): numeração tipográfica grande em ghost, conector vertical subtil.
- FAQ / pricing: tipografia mais arejada, separadores leves.
- Footer: condensado, link WhatsApp destacado.

**Navegação**
- Top bar com `backdrop-blur` quando scrolla, transição suave, logo nítido.
- Âncoras com `scroll-margin-top` para não ficar atrás da nav.

**Responsivo**
- Revisão mobile (≤390px): padding, tamanhos de fonte fluidos (`clamp`), CTA full-width, demo phone reescala para não cortar.
- Tablet: garantir que os mockups não ficam gigantes.

**Detalhes premium**
- Cursor (`a`, `button`) com transição suave.
- Estados de foco visíveis (ring âmbar) para acessibilidade.
- Imagens com `loading="lazy"` e `decoding="async"`.
- Smooth scroll global.

## Detalhes técnicos

- **Ficheiros tocados**: `src/landing/body.html` (markup da demo: cursor, controlos, progress; pequenos ajustes de classes nas restantes secções), `src/landing/script1.js` (state machine da demo, cursor mover, alvos por passo, observer de reduced-motion), `src/styles.css` (tokens, utilitários, animações), e o componente React que injeta o landing (apenas se for preciso passar props/estado).
- **Sem alterações** ao backoffice, schema, RLS, server functions ou copy.
- **Sem dependências novas** — tudo nativo (Web Animations API + CSS).

## Fora de âmbito

- Refazer o backoffice (`/admin/*`) — fica para um pedido seguinte se quiseres.
- Alterar conteúdo/textos da landing.
- Trocar imagens base64 atuais.
