
# Landing — 4 focused fixes

All changes are CSS/HTML only in `src/landing/body.html` and `src/landing/styles.css.txt`. No copy changes, no new sections, no DB.

## 1. Hero — remove green fade, simplify
- Remove the green radial/linear gradient and any glow layers from `.hero` (background → plain page background).
- Remove decorative blobs/blur/SVG noise inside `.hero` (any `::before`/`::after` overlays).
- Keep: kicker, H1, sub, primary CTA, hero stats. Drop secondary visual ornaments (extra pill chips, decorative arrows, gradient text on the headline if present — headline becomes solid foreground color).
- Tighten hero vertical padding slightly so the clean version doesn't feel empty.

## 2. Demo section — fits in one mobile screen
Target: section height ≤ 100vh on screens ≤ 640px, with the phone mockup as the clear focus.
- Reduce top/bottom padding of the demo section on mobile.
- Shrink the "DEMO INTERATIVA" kicker + H2 line-height and margin-bottom on mobile.
- Hide the explanatory paragraph under the H2 on mobile (`display:none` ≤ 640px), keep on desktop.
- Collapse the dashed progress segments into a thin single bar on mobile (smaller height, no per-step labels).
- Reduce gap between control buttons and "Recomeçar a demo".
- Cap the phone mockup height with `max-height: calc(100vh - 320px)` on mobile so the whole block fits.
- "Pronto para oferecer esta experiência?" CTA card: keep, but reduce its padding on mobile.

## 3. Gallery nav — 3 tabs visible at once on mobile
In `.gallery-nav` / `.gnav-btn` mobile rules (≤ 640px):
- `.gallery-nav { display:flex; flex-direction:row; gap:4px; overflow:visible; }` (drop scroll).
- `.gnav-btn { padding:6px 10px; font-size:11px; flex:1 1 0; min-width:0; }`
- Hide the numeric badge (`.gnav-num`) on mobile to save room; keep the label only.
- Label `.gnav-lbl` truncates with ellipsis if needed but at 11px all 3 fit at 375px.
- Keep desktop side-rail layout untouched.

## 4. Implementação — connector line + bolder badges
- Add a thin connector line between the 4 numbered steps:
  - Desktop: horizontal line behind the row of badges (`::before` on the steps container, `height:2px`, sits at badge vertical center, color `color-mix(in oklab, var(--teal) 25%, transparent)`).
  - Mobile: vertical line down the center of the badge column (`::before` `width:2px`, full height between first and last badge).
- Make number badges bolder/prominent: larger size (44px desktop / 40px mobile), solid teal background, white number, slight shadow, `font-weight:800`.
- Remove any extra decorative chips/icons around the steps; keep number + short title + 1-line description.
- Tighten vertical gap on mobile so the 4 steps feel like a fast sequence, not a long list.

## Files touched
- `src/landing/body.html` — remove hero decorative blobs, simplify demo progress markup, swap gallery-nav structure if needed for badge hide.
- `src/landing/styles.css.txt` — all visual rules above (hero background, demo mobile sizing, gallery-nav mobile, steps connector + badges).
