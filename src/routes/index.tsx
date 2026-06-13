import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import styles from "../landing/styles.css.txt?raw";
import script1 from "../landing/script1.js?raw";
import { getRenderedLanding } from "@/lib/render-landing.functions";

const landingQueryOptions = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getRenderedLanding(),
  staleTime: 30_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(landingQueryOptions),
  head: ({ loaderData }) => {
    const meta = loaderData?.meta;
    const title = meta?.title ?? "Gourmeats — Menus em vídeo para restaurantes";
    const description =
      meta?.description ??
      "Transforme a sua carta num menu em vídeo acessível por QR code.";
    const baseMeta = [
      { title },
      { name: "description", content: description },
      {
        name: "keywords",
        content:
          "menu digital, menu em vídeo, QR code restaurante, carta digital, ementa vídeo, restaurantes Portugal, Gourmeats",
      },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { property: "og:locale", content: "pt_PT" },
      { property: "og:site_name", content: "Gourmeats" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (meta?.ogImage) {
      baseMeta.push({ property: "og:image", content: meta.ogImage });
      baseMeta.push({ name: "twitter:image", content: meta.ogImage });
    }
    return {
      meta: baseMeta,
      links: [
        { rel: "canonical", href: "/" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap",
        },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div style={{ padding: 32, fontFamily: "sans-serif" }} role="alert">
      <h1>Erro a carregar a página</h1>
      <p>{error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div>Página não encontrada.</div>,
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(landingQueryOptions);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = document.createElement("script");
    s.textContent = script1;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [data.html]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div ref={ref} dangerouslySetInnerHTML={{ __html: data.html }} />
    </>
  );
}
