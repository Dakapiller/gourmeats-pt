import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, Star, AlertTriangle, Link as LinkIcon, Sparkles, Search, X } from "lucide-react";

type SortKey = "smart" | "az" | "za" | "recent" | "manual";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type Row = {
  id: string;
  name: string;
  logo_url: string | null;
  link_url: string | null;
  sort_order: number;
  visible: boolean;
  featured: boolean;
  featured_order: number | null;
  is_new: boolean;
  updated_at: string;
};

const MAX_FEATURED = 5;

function LogoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("restaurant-logos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data, error: signErr } = await supabase.storage
      .from("restaurant-logos")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !data) { toast.error(signErr?.message ?? "Erro"); setUploading(false); return; }
    onChange(data.signedUrl);
    setUploading(false);
  };
  return (
    <div className="space-y-2">
      {value && <img src={value} alt="preview" className="w-16 h-16 rounded-md object-cover border" />}
      <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => {
        const f = e.target.files?.[0]; if (f) upload(f);
      }} />
      <Input type="url" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="ou cola um URL" />
    </div>
  );
}

function RestaurantsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("featured", { ascending: false })
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const missingUrl = rows.filter((r) => !r.link_url).length;
  const featuredCount = rows.filter((r) => r.featured).length;

  const startNew = () => {
    setEditing({
      id: "",
      name: "",
      logo_url: null,
      link_url: null,
      sort_order: (rows[rows.length - 1]?.sort_order ?? 0) + 1,
      visible: true,
      featured: false,
      featured_order: null,
      is_new: false,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (editing.featured && !rows.find((r) => r.id === editing.id)?.featured && featuredCount >= MAX_FEATURED) {
      toast.error(`Já tens ${MAX_FEATURED} destaques. Remove um primeiro.`);
      return;
    }
    const payload = {
      name: editing.name,
      logo_url: editing.logo_url || null,
      link_url: editing.link_url || null,
      sort_order: editing.sort_order,
      visible: editing.visible,
      featured: editing.featured,
      featured_order: editing.featured ? (editing.featured_order ?? featuredCount + 1) : null,
      is_new: editing.is_new,
    };
    const { error } = editing.id
      ? await supabase.from("restaurants").update(payload).eq("id", editing.id)
      : await supabase.from("restaurants").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado");
    setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Apagar este restaurante?")) return;
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removido"); load(); }
  };

  const toggleFeatured = async (r: Row) => {
    if (!r.featured && featuredCount >= MAX_FEATURED) {
      toast.error(`Limite de ${MAX_FEATURED} destaques atingido.`);
      return;
    }
    const { error } = await supabase
      .from("restaurants")
      .update({
        featured: !r.featured,
        featured_order: !r.featured ? featuredCount + 1 : null,
      })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else load();
  };

  const toggleVisible = async (r: Row) => {
    await supabase.from("restaurants").update({ visible: !r.visible }).eq("id", r.id);
    load();
  };

  const move = async (r: Row, dir: -1 | 1) => {
    const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((x) => x.id === r.id);
    const other = sorted[idx + dir];
    if (!other) return;
    await Promise.all([
      supabase.from("restaurants").update({ sort_order: other.sort_order }).eq("id", r.id),
      supabase.from("restaurants").update({ sort_order: r.sort_order }).eq("id", other.id),
    ]);
    load();
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Restaurantes clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Os destacados (até {MAX_FEATURED}) aparecem primeiro na landing. Os restantes ficam atrás de "Ver todos".
          </p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4" /> Adicionar</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Card className={`p-4 flex items-center gap-3 ${featuredCount > MAX_FEATURED ? "border-destructive" : ""}`}>
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Destaques: {featuredCount}/{MAX_FEATURED}</p>
            <p className="text-xs text-muted-foreground">Marca até {MAX_FEATURED} para aparecerem em primeiro plano.</p>
          </div>
        </Card>
        <Card className={`p-4 flex items-center gap-3 ${missingUrl > 0 ? "border-amber-500/60 bg-amber-50/40" : ""}`}>
          <AlertTriangle className={`h-5 w-5 ${missingUrl > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold">{missingUrl} sem URL Gourmeats</p>
            <p className="text-xs text-muted-foreground">Adiciona o link da carta para os clientes poderem abrir.</p>
          </div>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <Card key={r.id} className={`p-4 flex items-start gap-3 ${r.featured ? "border-amber-400/70" : ""}`}>
              <div className="flex flex-col gap-1">
                <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => move(r, -1)} disabled={i === 0} aria-label="Subir">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => move(r, 1)} disabled={i === rows.length - 1} aria-label="Descer">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {r.logo_url ? (
                  <img src={r.logo_url} alt={r.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{r.name}</p>
                    {r.featured && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Destaque
                      </span>
                    )}
                    {r.is_new && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                        <Sparkles className="h-3 w-3" /> Novo
                      </span>
                    )}
                    {!r.link_url && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="h-3 w-3" /> Sem URL Gourmeats
                      </span>
                    )}
                  </div>
                  {r.link_url ? (
                    <a href={r.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate max-w-full">
                      <LinkIcon className="h-3 w-3" /> {r.link_url}
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleFeatured(r)}
                  className="p-2 rounded hover:bg-muted"
                  aria-label={r.featured ? "Remover destaque" : "Marcar destaque"}
                  title={r.featured ? "Remover destaque" : "Marcar destaque"}
                >
                  <Star className={`h-4 w-4 ${r.featured ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                </button>
                <button
                  onClick={async () => {
                    const { error } = await supabase.from("restaurants").update({ is_new: !r.is_new }).eq("id", r.id);
                    if (error) toast.error(error.message); else load();
                  }}
                  className="p-2 rounded hover:bg-muted"
                  aria-label={r.is_new ? "Remover etiqueta Novo" : "Marcar como Novo"}
                  title={r.is_new ? "Remover etiqueta Novo" : "Marcar como Novo"}
                >
                  <Sparkles className={`h-4 w-4 ${r.is_new ? "text-teal-600" : "text-muted-foreground"}`} />
                </button>
                <Switch checked={r.visible} onCheckedChange={() => toggleVisible(r)} />
                <Button size="icon" variant="ghost" onClick={() => { setEditing({ ...r }); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar restaurante" : "Novo restaurante"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Logo</Label>
                <LogoUpload value={editing.logo_url ?? ""} onChange={(v) => setEditing({ ...editing, logo_url: v })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="link">URL Gourmeats (carta)</Label>
                <Input id="link" type="url" value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://qr.gourmeatsapp.com/n/…" />
                {!editing.link_url && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Sem URL, o cartão não será clicável na landing.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort">Ordem</Label>
                  <Input id="sort" type="number" className="w-24" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="visible" checked={editing.visible} onCheckedChange={(v) => setEditing({ ...editing, visible: v })} />
                  <Label htmlFor="visible">Visível</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="featured" checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} />
                  <Label htmlFor="featured">Destaque</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="is_new" checked={editing.is_new} onCheckedChange={(v) => setEditing({ ...editing, is_new: v })} />
                  <Label htmlFor="is_new">Etiqueta "Novo"</Label>
                </div>
                {editing.featured && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="forder">Ordem destaque</Label>
                    <Input id="forder" type="number" className="w-20" value={editing.featured_order ?? ""} onChange={(e) => setEditing({ ...editing, featured_order: e.target.value === "" ? null : Number(e.target.value) })} />
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/restaurants")({
  component: RestaurantsAdmin,
});
