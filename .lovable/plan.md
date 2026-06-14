## Goal
Add 2 new floating annotation callouts to the hero phone mockup, matching the existing visual style.

## Changes

### 1. HTML (`src/landing/body.html`)
Inside `.phone-wrap`, add 2 new `.fc` elements:

- **Callout 1 — Google Reviews**
  - Position: `top:2%; right:-12%; width: 168px`
  - Content: green dot, label "GOOGLE REVIEWS", subtext "link direto para as suas reviews"

- **Callout 2 — Reservas**
  - Position: `top:6%; left:-18%; width: 152px`
  - Content: green dot, label "RESERVAS", subtext "link direto para reservar mesa"

All 4 callouts (existing + new) will get unique classes (`.fc-mesa`, `.fc-lang`, `.fc-reviews`, `.fc-reservas`) so CSS sibling selectors don't break.

### 2. CSS (`src/landing/styles.css.txt`)
- Replace `.fc:first-of-type` / `.fc:last-of-type` selectors with class-based ones (`.fc-mesa`, `.fc-lang`) so the existing mobile repositioning continues to target the correct original callouts.
- Add mobile repositioning rules for `.fc-reviews` and `.fc-reservas` to keep them within viewport bounds on narrow screens.
- On extra-small screens (`max-width:380px`), hide the most peripheral callouts to prevent overflow.

No other page changes. No copy edits.