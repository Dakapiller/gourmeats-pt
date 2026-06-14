## Fix 3 hero issues

### 1. Callout cards — text overflow
File: `src/landing/styles.css.txt`, line 100 (`.fc`)

Replace the `white-space:nowrap` rule (which is what causes the overflow) and add containment:
```css
.fc{position:absolute;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.12),0 1px 4px rgba(0,0,0,.06);padding:12px 14px;font-size:12px;line-height:1.4;max-width:160px;word-wrap:break-word;overflow-wrap:break-word;overflow:hidden;box-sizing:border-box}
```
No changes to the per-callout positioning classes — their explicit widths already fit within 160px.

### 2. Navbar logo — use correct Gourmeats logo
The repo has no existing Gourmeats logo asset (only `favicon.ico`). The user attached `Logo-Gourmeats-Negro.png` in this turn. Upload it via `lovable-assets` (from `/mnt/user-uploads/`) to create `src/assets/logo-gourmeats.png.asset.json`, then in `src/landing/body.html` line 4 replace:
```html
<div class="logo">gour<span>meats</span></div>
```
with an `<img>` referencing the asset URL (baked into the template at build via a tiny inline literal — since `body.html` is a `?raw` import, embed the CDN URL directly). Add a CSS rule so `.logo img` sizes correctly (height ~22px, mobile ~18px).

### 3. Remove the kicker pill
In `src/landing/body.html` line 17, delete:
```html
<div class="hero-kicker">%%HERO_KICKER%%</div>
```
Leaves the DB field untouched (admin-editable) but removes it from the hero. No CSS deletion needed — `.hero-kicker` rules just become unused.

### Files changed
- `src/landing/styles.css.txt` (callout rule + `.logo img` sizing)
- `src/landing/body.html` (logo markup, remove kicker line)
- `src/assets/logo-gourmeats.png.asset.json` (new, via lovable-assets CLI)

No other sections touched.