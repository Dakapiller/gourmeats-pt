import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import styles from "../landing/styles.css.txt?raw";
import body from "../landing/body.html?raw";
import script1 from "../landing/script1.js?raw";

const META_TITLE = "Gourmeats — Menus em vídeo para restaurantes";
const META_DESC =
  "Transforme a sua carta num menu em vídeo acessível por QR code. Sem app, sem download. Aumente o ticket médio com vídeos profissionais dos seus pratos.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      {
        name: "keywords",
        content:
          "menu digital, menu em vídeo, QR code restaurante, carta digital, ementa vídeo, restaurantes Portugal, Gourmeats",
      },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { property: "og:locale", content: "pt_PT" },
      { property: "og:site_name", content: "Gourmeats" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: META_TITLE },
      { name: "twitter:description", content: META_DESC },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Gourmeats",
          url: "/",
          description: META_DESC,
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+351916082384",
            email: "andre.duque@gourmeatsapp.com",
            contactType: "sales",
            areaServed: "PT",
            availableLanguage: ["Portuguese", "English", "Spanish"],
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Gourmeats — Menu digital em vídeo",
          description: META_DESC,
          brand: { "@type": "Brand", name: "Gourmeats" },
          category: "Restaurant menu software",
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            offerCount: "26",
          },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = document.createElement("script");
    s.textContent = script1;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div ref={ref} dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
}
