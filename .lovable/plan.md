## Mobile callouts beside the phone

Edits limited to `src/landing/body.html` and `src/landing/styles.css.txt`. No other sections touched.

### 1. Star instead of green dot on Google Reviews
`src/landing/body.html` line 42 — inside `.fc-reviews .fc-lbl`, swap `<span class="dot" style="background:#22c55e"></span>` for `<span class="fc-star" aria-hidden="true">★</span>` and recolor the label from green (`#16a34a`) to a neutral dark (`#1a1a18`) so the star carries the meaning. Reservas keeps its green dot.

Add a tiny `.fc-star` rule in `styles.css.txt` (size ~11px, color `#f5a623`, margin-right 4px, vertical-align baseline) so it matches the dot's footprint.

### 2. Re-float the callouts on mobile, next to the phone (not stacked below)

In the `@media(max-width:768px)` block in `styles.css.txt` (currently lines 422–439):

- Remove the lines that hide `.fc-reviews,.fc-reservas` and the `.fc,.fc-mesa,.fc-lang,[class*="callout"]...` selector (keep them visible on mobile).
- Remove the entire `.fc-mob-row` mobile pill ruleset (lines 435–438) and the `.fc-mob-row{display:contents}` desktop line (line 98) — wrapper goes back to passive container.
- Hide `.hero-feats` on mobile (`display:none`) since the cards return.
- Override desktop positioning so the two cards sit immediately to each side of the 210px phone, aligned with its top browser bar:
  - `.phone-wrap{position:relative}` (already set)
  - `.fc-reservas{position:absolute;top:38px;right:auto;left:-6px;width:96px;max-width:96px;padding:6px 8px;font-size:10px;transform:translateX(-100%)}`
  - `.fc-reviews{position:absolute;top:38px;left:auto;right:-6px;width:96px;max-width:96px;padding:6px 8px;font-size:10px;transform:translateX(100%)}`
  - Inline `width:168px`/`width:152px` from the HTML is overridden by the mobile rule.
  - Shrink inner type: `.fc-lbl{font-size:9px;margin-bottom:2px}`, `.fc-sub{font-size:9.5px;line-height:1.3}`.
  - Arrows: keep the existing `::after` pointers (already point inward toward the phone) but reduce border size to 5px so they fit the smaller card.
- Text containment: keep `word-wrap:break-word;overflow-wrap:break-word;overflow:hidden` (already on `.fc`). With 96px width and 9–10px type, the labels `Google Reviews` / `Reservas` and short subs stay on 1–2 lines without clipping.

### 3. Mobile layout order

Keep `.hero-in{flex-direction:column;gap:24px}` and `.phone-wrap{order:-1}` so the phone still renders first on mobile. `.hero-stats{display:none}` stays. The callouts come along with the phone since they're its children, so they reposition automatically.

### Risk / fallback for very narrow screens (<360px)

96px cards with `translateX(±100%)` need ~96px of free space on each side of the 210px phone. On a 360px viewport that's `(360−210)/2 = 75px` per side — 21px short. Add a `@media(max-width:380px)` tweak: shrink phone to `width:190px` and cards to `width:84px`, so it fits without horizontal scroll.

### Files changed
- `src/landing/body.html` (Google Reviews dot → ⭐, label color)
- `src/landing/styles.css.txt` (mobile callout repositioning, hide `.hero-feats` on mobile, `.fc-star`, narrow-screen tweak)
