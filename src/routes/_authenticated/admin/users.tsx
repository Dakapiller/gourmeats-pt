import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listAdminUsers,
  setUserRole,
  type AdminUser,
  type AppRole,
} from "@/lib/admin-users.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  ssr: false,
  component: UsersAdmin,
});

function UsersAdmin() {
  const router = useRouter();
  const fetchList = useServerFn(listAdminUsers);
  const mutate = useServerFn(setUserRole);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchList();
      setUsers(data);
    } catch (e: any) {
      toast.error(e.message ?? "Erro a carregar utilizadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (u: AdminUser, role: AppRole, grant: boolean) => {
    try {
      await mutate({ data: { userId: u.id, role, grant } });
      toast.success("Atualizado");
      load();
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message ?? "Falhou");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Utilizadores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gere quem tem acesso ao backoffice. O primeiro registo recebe automaticamente a role{" "}
          <code>admin</code>; os seguintes ficam como <code>editor</code> e só vêem o admin se lhes
          atribuíres a role.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Sem utilizadores.</Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isAdmin = u.roles.includes("admin");
            const isEditor = u.roles.includes("editor");
            return (
              <Card key={u.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.email || "(sem email)"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex gap-1.5 flex-wrap">
                    {u.roles.length === 0 ? (
                      <Badge variant="outline">sem role</Badge>
                    ) : (
                      u.roles.map((r) => (
                        <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                          {r}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`admin-${u.id}`}
                      checked={isAdmin}
                      onCheckedChange={(v) => toggle(u, "admin", v)}
                    />
                    <Label htmlFor={`admin-${u.id}`} className="text-sm">
                      Admin
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`editor-${u.id}`}
                      checked={isEditor}
                      onCheckedChange={(v) => toggle(u, "editor", v)}
                    />
                    <Label htmlFor={`editor-${u.id}`} className="text-sm">
                      Editor
                    </Label>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
