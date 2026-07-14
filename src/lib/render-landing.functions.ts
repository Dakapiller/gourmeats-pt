import { createServerFn } from "@tanstack/react-start";
import bodyTemplate from "../landing/body.html?raw";

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Allow safe <strong>/<em>/<br> in admin-entered text (admin-only authoring).
const lightHtml = (s: string) => {
  const esc = escapeHtml(s);
  return esc
    .replace(/&lt;(\/?)(strong|em|b|i|br)\s*\/?&gt;/gi, "<$1$2>")
    .replace(/\n/g, "<br>");
};

const initial = (name: string) => (name?.trim()?.[0] ?? "?").toUpperCase();

export const getRenderedLanding = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ html: string; meta: { title: string; description: string; ogImage: string | null } }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin;

    const [settings, hero, heroStats, proof, restaurants, faq, cta, features] = await Promise.all([
      sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      sb.from("hero_section").select("*").eq("id", 1).maybeSingle(),
      sb.from("hero_stats").select("id, value, label").eq("visible", true).order("sort_order"),
      sb.from("proof_cards").select("id, quote, author_name, author_role").eq("visible", true).order("sort_order"),
      sb.from("restaurants").select("id, name, logo_url, link_url, featured, featured_order, is_new, accent_color").eq("visible", true).order("sort_order"),
      sb.from("faq_items").select("id, question, answer").eq("visible", true).order("sort_order"),
      sb.from("cta_section").select("*").eq("id", 1).maybeSingle(),
      sb.from("features").select("id, title, description").eq("visible", true).order("sort_order").limit(4),
    ]);

    const s = settings.data ?? {
      site_name: "Gourmeats",
      meta_title: "Gourmeats — Menus em vídeo para restaurantes",
      meta_description: "Menus em vídeo para restaurantes.",
      og_image_url: null,
      whatsapp_number: "+351916082384",
      whatsapp_display: "+351 916 082 384",
      contact_email: "andre.duque@gourmeatsapp.com",
      cta_message: "Olá! Vi a Gourmeats e queria saber mais.",
    };
    const h = hero.data ?? {
      kicker: "Menu digital em vídeo · QR code",
      headline: "A carta que vende os pratos por si.",
      subheadline: "",
      primary_cta_label: "Falar no WhatsApp",
      secondary_cta_label: "Ver demo",
    };
    const c = cta.data ?? {
      headline: "Pronto para a carta que vende sozinha?",
      subheadline: "Carta online em 24 horas. Vídeos dos pratos em 7 dias. Fale connosco hoje.",
      primary_cta_label: "Falar no WhatsApp agora",
    };

    // --- render dynamic blocks ---
    const heroStatsHtml = (heroStats.data ?? [])
      .map(
        (st) =>
          `<div class="stat-card" data-stat data-stat-value="${escapeHtml(st.value ?? "")}"><div class="stat-n">${lightHtml(
            st.value,
          )}</div><div class="stat-l">${lightHtml(st.label)}</div></div>`,
      )
      .join("");

    const renderLogoCard = (r: { name: string; logo_url: string | null; link_url: string | null; is_new?: boolean }) => {
      const href = r.link_url ? ` href="${escapeHtml(r.link_url)}" target="_blank" rel="noopener"` : "";
      const tag = r.link_url ? "a" : "div";
      const img = r.logo_url
        ? `<img src="${escapeHtml(r.logo_url)}" alt="${escapeHtml(r.name)}">`
        : `<div class="logo-card-ph">${escapeHtml(r.name)}</div>`;
      const newBadge = r.is_new ? '<span class="logo-card-new">Novo</span>' : "";
      return `<${tag} class="logo-card${r.is_new ? " is-new" : ""}"${href}>${newBadge}${img}<div class="logo-card-name">${escapeHtml(
        r.name,
      )}</div>${r.link_url ? '<div class="logo-card-cta">Ver carta →</div>' : ""}</${tag}>`;
    };

    const allRestaurants = restaurants.data ?? [];
    const featured = allRestaurants
      .filter((r) => r.featured)
      .sort((a, b) => (a.featured_order ?? 999) - (b.featured_order ?? 999));
    const others = allRestaurants.filter((r) => !r.featured);
    const featuredList = featured.length > 0 ? featured : allRestaurants;
    const extraList = featured.length > 0 ? others : [];
    const logosHtml = featuredList.map(renderLogoCard).join("");
    const logosExtraHtml = extraList.map(renderLogoCard).join("");
    const logosToggleHtml = extraList.length > 0
      ? `<button type="button" class="logos-toggle" data-logos-toggle aria-expanded="false"><span class="logos-toggle-more">Ver todos os restaurantes (${allRestaurants.length})</span><span class="logos-toggle-less">Mostrar menos</span></button>`
      : "";

    const marqueeNames = allRestaurants.map((r) => r.name);
    const renderMarqueeGroup = () =>
      marqueeNames.map((n) => `<span class="trusted-name">${escapeHtml(n)}</span><span class="trusted-sep" aria-hidden="true">•</span>`).join("");
    const trustedMarqueeHtml = marqueeNames.length > 0
      ? `<div class="trusted-group">${renderMarqueeGroup()}</div><div class="trusted-group" aria-hidden="true">${renderMarqueeGroup()}</div>`
      : "";

    // --- Demo Real: interactive restaurant selector ---
    const featuredWithUrl = featured.filter((r) => !!r.link_url);
    const anyWithUrl = allRestaurants.filter((r) => !!r.link_url);
    const demoRealList = featuredWithUrl.length >= 2 ? featuredWithUrl : anyWithUrl.slice(0, 5);
    const renderDemoItem = (r: typeof allRestaurants[number], selected: boolean) => {
      const accent = (r.accent_color && /^#[0-9a-fA-F]{3,8}$/.test(r.accent_color)) ? r.accent_color : "#0d9488";
      const img = r.logo_url
        ? `<img src="${escapeHtml(r.logo_url)}" alt="" class="demo-item-logo">`
        : `<div class="demo-item-logo demo-item-logo-ph" style="background:${accent}">${escapeHtml(
            (r.name || "??").trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase(),
          )}</div>`;
      return `<button type="button" class="demo-item${selected ? " is-selected" : ""}" data-demo-item data-url="${escapeHtml(
        r.link_url ?? "",
      )}" data-name="${escapeHtml(r.name)}" data-accent="${escapeHtml(accent)}" role="option"${selected ? ' aria-selected="true"' : ""} style="--accent:${accent}">${img}<div class="demo-item-body"><div class="demo-item-name">${escapeHtml(
        r.name,
      )}</div><div class="demo-item-cta">Ver carta →</div></div></button>`;
    };
    const demoRealListHtml = demoRealList.map((r, i) => renderDemoItem(r, i === 0)).join("");
    const demoRealFirst = demoRealList[0];
    const demoRealFirstUrl = demoRealFirst?.link_url ?? "";
    const demoRealFirstName = demoRealFirst?.name ?? "um cliente Gourmeats";


    const proofHtml = (proof.data ?? [])
      .map(
        (p) =>
          `<div class="proof-card"><div class="proof-stars">★★★★★</div><p class="proof-q">${lightHtml(
            p.quote,
          )}</p><div class="proof-who"><div class="proof-av">${initial(
            p.author_name,
          )}</div><div><div class="proof-name">${escapeHtml(
            p.author_name,
          )}</div><div class="proof-role">${escapeHtml(p.author_role)}</div></div></div></div>`,
      )
      .join("");

    const faqHtml = (faq.data ?? [])
      .map(
        (f) =>
          `<details><summary>${escapeHtml(f.question)}</summary><div class="faq-body">${lightHtml(
            f.answer,
          )}</div></details>`,
      )
      .join("");

    // Render template
    let html = bodyTemplate
      .replace(/%%HERO_KICKER%%/g, escapeHtml(h.kicker ?? ""))
      .replace(/%%HERO_H1%%/g, lightHtml(h.headline ?? ""))
      .replace(/%%HERO_SUB%%/g, lightHtml(h.subheadline ?? ""))
      .replace(/%%HERO_CTA_LABEL%%/g, escapeHtml(h.primary_cta_label ?? "Pedir demonstração"))
      .replace(/%%HERO_STATS%%/g, heroStatsHtml)
      .replace(/%%TRUSTED_MARQUEE%%/g, trustedMarqueeHtml)
      .replace(/%%LOGOS_ROW%%/g, logosHtml)
      .replace(/%%LOGOS_EXTRA%%/g, logosExtraHtml)
      .replace(/%%LOGOS_TOGGLE%%/g, logosToggleHtml)
      .replace(/%%PROOF_GRID%%/g, proofHtml)
      .replace(/%%FAQ_LIST%%/g, faqHtml)
      .replace(/%%FINAL_H%%/g, lightHtml(c.headline ?? ""))
      .replace(/%%FINAL_SUB%%/g, lightHtml(c.subheadline ?? ""))
      .replace(/%%DEMO_REAL_LIST%%/g, demoRealListHtml)
      .replace(/%%DEMO_REAL_FIRST_URL%%/g, escapeHtml(demoRealFirstUrl))
      .replace(/%%DEMO_REAL_FIRST_NAME%%/g, escapeHtml(demoRealFirstName));

    // Global replacement of contact info (phone + email) baked in the static template
    const waNumber = (s.whatsapp_number ?? "+351916082384").replace(/[^\d]/g, "");
    const waDisplay = s.whatsapp_display ?? "+351 916 082 384";
    const email = s.contact_email ?? "andre.duque@gourmeatsapp.com";

    html = html
      .replace(/wa\.me\/351916082384/g, `wa.me/${waNumber}`)
      .replace(/href="https:\/\/wa\.me\/351916082384"/g, `href="https://wa.me/${waNumber}"`)
      .replace(/andre\.duque@gourmeatsapp\.com/g, email)
      .replace(/\+351 916 082 384/g, waDisplay);

    return {
      html,
      meta: {
        title: s.meta_title ?? "Gourmeats",
        description: s.meta_description ?? "",
        ogImage: s.og_image_url ?? null,
      },
    };
  },
);
