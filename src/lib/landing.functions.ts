import { createServerFn } from "@tanstack/react-start";

export type LandingContent = {
  settings: {
    site_name: string;
    meta_title: string;
    meta_description: string;
    og_image_url: string | null;
    whatsapp_number: string;
    whatsapp_display: string;
    contact_email: string;
    cta_message: string;
  };
  hero: {
    kicker: string;
    headline: string;
    subheadline: string;
    primary_cta_label: string;
    secondary_cta_label: string;
  };
  heroStats: { id: string; value: string; label: string }[];
  proof: { id: string; quote: string; author_name: string; author_role: string }[];
  restaurants: { id: string; name: string; logo_url: string | null; link_url: string | null }[];
  metrics: { id: string; value: string; description: string }[];
  features: { id: string; icon: string | null; title: string; description: string }[];
  faq: { id: string; question: string; answer: string }[];
  cta: { headline: string; subheadline: string; primary_cta_label: string };
};

export const getLandingContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingContent> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin;

    const [settings, hero, heroStats, proof, restaurants, metrics, features, faq, cta] =
      await Promise.all([
        sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
        sb.from("hero_section").select("*").eq("id", 1).maybeSingle(),
        sb.from("hero_stats").select("id, value, label").eq("visible", true).order("sort_order"),
        sb
          .from("proof_cards")
          .select("id, quote, author_name, author_role")
          .eq("visible", true)
          .order("sort_order"),
        sb
          .from("restaurants")
          .select("id, name, logo_url, link_url")
          .eq("visible", true)
          .order("sort_order"),
        sb
          .from("metrics")
          .select("id, value, description")
          .eq("visible", true)
          .order("sort_order"),
        sb
          .from("features")
          .select("id, icon, title, description")
          .eq("visible", true)
          .order("sort_order"),
        sb
          .from("faq_items")
          .select("id, question, answer")
          .eq("visible", true)
          .order("sort_order"),
        sb.from("cta_section").select("*").eq("id", 1).maybeSingle(),
      ]);

    return {
      settings: settings.data ?? {
        site_name: "Gourmeats",
        meta_title: "Gourmeats — Menus em vídeo para restaurantes",
        meta_description: "Menus em vídeo para restaurantes.",
        og_image_url: null,
        whatsapp_number: "+351916082384",
        whatsapp_display: "+351 916 082 384",
        contact_email: "andre.duque@gourmeatsapp.com",
        cta_message: "Olá! Vi a Gourmeats e queria saber mais.",
      },
      hero: hero.data ?? {
        kicker: "",
        headline: "",
        subheadline: "",
        primary_cta_label: "Falar no WhatsApp",
        secondary_cta_label: "Ver demo",
      },
      heroStats: heroStats.data ?? [],
      proof: proof.data ?? [],
      restaurants: restaurants.data ?? [],
      metrics: metrics.data ?? [],
      features: features.data ?? [],
      faq: faq.data ?? [],
      cta: cta.data ?? {
        headline: "",
        subheadline: "",
        primary_cta_label: "Falar no WhatsApp agora",
      },
    };
  },
);
