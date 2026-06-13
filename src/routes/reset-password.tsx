import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts session in URL hash on recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setReady(true);
      });
    }
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success("Password atualizada");
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Toaster richColors position="top-center" />
      <Card className="w-full max-w-md p-8">
        <h1 className="text-xl font-bold mb-4">Nova password</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground">
            Link inválido ou expirado. Volta a pedir recuperação.
          </p>
        ) : (
          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="np">Nova password</Label>
              <Input
                id="np"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full">
              Atualizar
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
