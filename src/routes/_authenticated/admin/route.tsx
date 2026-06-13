import { createFileRoute, Outlet, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import {
  Settings,
  LayoutGrid,
  Quote,
  Store,
  BarChart3,
  Sparkles,
  HelpCircle,
  Megaphone,
  LogOut,
  Home,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutGrid, exact: true },
  { to: "/admin/settings", label: "Definições do site", icon: Settings },
  { to: "/admin/hero", label: "Hero + Stats", icon: Sparkles },
  { to: "/admin/proof", label: "Depoimentos", icon: Quote },
  { to: "/admin/restaurants", label: "Restaurantes", icon: Store },
  { to: "/admin/metrics", label: "Métricas", icon: BarChart3 },
  { to: "/admin/features", label: "Features", icon: LayoutGrid },
  { to: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { to: "/admin/cta", label: "CTA final", icon: Megaphone },
] as const;

function AdminLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        A verificar permissões…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Sem acesso</h1>
          <p className="text-sm text-muted-foreground mb-6">
            A tua conta ({email}) não tem permissões de administrador. Pede a um admin para te
            atribuir a role <code>admin</code> na tabela <code>user_roles</code>.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Voltar à landing</Link>
            </Button>
            <Button onClick={signOut} variant="ghost">
              <LogOut className="h-4 w-4" /> Terminar sessão
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Toaster richColors position="top-center" />
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-5 border-b">
          <Link to="/" className="text-base font-extrabold">
            Gourm<span style={{ color: "#7A6200" }}>eats</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Backoffice</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
          >
            <Home className="h-4 w-4" /> Ver landing
          </Link>
          <div className="px-3 pt-2 pb-1 text-xs text-muted-foreground truncate" title={email}>
            {email}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm w-full text-left hover:bg-muted text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
