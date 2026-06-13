import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import styles from "../landing/styles.css.txt?raw";
import body from "../landing/body.html?raw";
import script1 from "../landing/script1.js?raw";
import script2 from "../landing/script2.js?raw";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gourmeats — Menus em vídeo para restaurantes" },
      {
        name: "description",
        content:
          "Transforme a sua carta num menu em vídeo. Os clientes vêem os pratos em vídeo antes de pedir.",
      },
      { property: "og:title", content: "Gourmeats — Menus em vídeo para restaurantes" },
      {
        property: "og:description",
        content:
          "Transforme a sua carta num menu em vídeo. Os clientes vêem os pratos em vídeo antes de pedir.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tags: HTMLScriptElement[] = [];
    for (const src of [script1, script2]) {
      const s = document.createElement("script");
      s.textContent = src;
      document.body.appendChild(s);
      tags.push(s);
    }
    return () => {
      tags.forEach((s) => s.remove());
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div ref={ref} dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
}
