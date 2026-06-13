import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import {
  Settings,
  Sparkles,
  Quote,
  Store,
  BarChart3,
  LayoutGrid,
  HelpCircle,
  Megaphone,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

const SECTIONS = [
  { to: "/admin/settings", title: "Definições do site", desc: "Contactos, SEO, OG image.", icon: Settings },
  { to: "/admin/hero", title: "Hero + Stats", desc: "Título, subtítulo e estatísticas.", icon: Sparkles },
  { to: "/admin/proof", title: "Depoimentos", desc: "Citações de clientes.", icon: Quote },
  { to: "/admin/restaurants", title: "Restaurantes", desc: "Lista de clientes ativos.", icon: Store },
  { to: "/admin/metrics", title: "Métricas", desc: "Números de impacto.", icon: BarChart3 },
  { to: "/admin/features", title: "Features", desc: "Cartões de benefícios.", icon: LayoutGrid },
  { to: "/admin/faq", title: "FAQ", desc: "Perguntas frequentes.", icon: HelpCircle },
  { to: "/admin/cta", title: "CTA final", desc: "Secção de conversão.", icon: Megaphone },
];

function AdminHome() {
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Backoffice Gourmeats</h1>
      <p className="text-muted-foreground mb-8">
        Edita qualquer secção da landing. Alterações são publicadas em tempo real.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ to, title, desc, icon: Icon }) => (
          <Link key={to} to={to as never}>
            <Card className="p-5 h-full hover:border-primary/50 transition-colors cursor-pointer">
              <Icon className="h-6 w-6 mb-3 text-primary" />
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
