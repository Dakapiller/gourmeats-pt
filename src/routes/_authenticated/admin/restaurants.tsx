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

function FilterChip({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
      }`}
    >
      {icon}{children}
    </button>
  );
}

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
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("smart");
  const [fFeatured, setFFeatured] = useState(false);
  const [fNew, setFNew] = useState(false);
  const [fNoUrl, setFNoUrl] = useState(false);
  const [fHidden, setFHidden] = useState(false);

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
      updated_at: new Date().toISOString(),
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

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    let list = rows.filter((r) => {
      if (q && !normalize(r.name).includes(q)) return false;
      if (fFeatured && !r.featured) return false;
      if (fNew && !r.is_new) return false;
      if (fNoUrl && r.link_url) return false;
      if (fHidden && r.visible) return false;
      return true;
    });
    if (sortKey === "az") list.sort((a, b) => a.name.localeCompare(b.name, "pt"));
    else if (sortKey === "za") list.sort((a, b) => b.name.localeCompare(a.name, "pt"));
    else if (sortKey === "recent") list.sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
    else if (sortKey === "manual") list.sort((a, b) => a.sort_order - b.sort_order);
    else {
      // smart: featured (by featured_order) → new → A-Z
      list.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.featured && b.featured) return (a.featured_order ?? 999) - (b.featured_order ?? 999);
        if (a.is_new !== b.is_new) return a.is_new ? -1 : 1;
        return a.name.localeCompare(b.name, "pt");
      });
    }
    return list;
  }, [rows, query, sortKey, fFeatured, fNew, fNoUrl, fHidden]);

  const activeFilters = [fFeatured, fNew, fNoUrl, fHidden].filter(Boolean).length;
  const clearFilters = () => { setFFeatured(false); setFNew(false); setFNoUrl(false); setFHidden(false); setQuery(""); };

  return (
    <div className="max-w-5xl flex flex-col h-[calc(100vh-80px)]">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-background pb-3 border-b">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Restaurantes clientes</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rows.length} restaurantes · <span className="text-amber-700">{featuredCount}/{MAX_FEATURED} em destaque</span> · <span className={missingUrl > 0 ? "text-amber-700" : ""}>{missingUrl} sem URL</span>
            </p>
          </div>
          <Button onClick={startNew} size="sm"><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por nome…"
              className="pl-8 pr-8 h-9"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpar">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="smart">Destaques + A–Z</SelectItem>
              <SelectItem value="az">Nome A–Z</SelectItem>
              <SelectItem value="za">Nome Z–A</SelectItem>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="manual">Ordem manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <FilterChip active={fFeatured} onClick={() => setFFeatured(!fFeatured)} icon={<Star className="h-3 w-3" />}>Em destaque</FilterChip>
          <FilterChip active={fNew} onClick={() => setFNew(!fNew)} icon={<Sparkles className="h-3 w-3" />}>Novos</FilterChip>
          <FilterChip active={fNoUrl} onClick={() => setFNoUrl(!fNoUrl)} icon={<AlertTriangle className="h-3 w-3" />}>Sem URL</FilterChip>
          <FilterChip active={fHidden} onClick={() => setFHidden(!fHidden)}>Ocultos</FilterChip>
          {(activeFilters > 0 || query) && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 underline">Limpar</button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto pt-3 pr-1 -mr-1">
        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum restaurante corresponde aos filtros.</p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((r, i) => (
              <Card key={r.id} className={`px-3 py-2 flex items-center gap-2 ${r.featured ? "border-amber-400/70" : ""}`}>
                {sortKey === "manual" && (
                  <div className="flex flex-col">
                    <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => move(r, -1)} disabled={i === 0} aria-label="Subir">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => move(r, 1)} disabled={i === filtered.length - 1} aria-label="Descer">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {r.logo_url ? (
                  <img src={r.logo_url} alt={r.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                        <AlertTriangle className="h-3 w-3" /> Sem URL
                      </span>
                    )}
                    {!r.visible && (
                      <span className="inline-flex items-center text-[10px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Oculto</span>
                    )}
                  </div>
                  {r.link_url && (
                    <a href={r.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground truncate max-w-full">
                      <LinkIcon className="h-3 w-3" /> <span className="truncate">{r.link_url}</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleFeatured(r)}
                    className="p-1.5 rounded hover:bg-muted"
                    title={r.featured ? "Remover destaque" : "Marcar destaque"}
                  >
                    <Star className={`h-4 w-4 ${r.featured ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                  </button>
                  <button
                    onClick={async () => {
                      const { error } = await supabase.from("restaurants").update({ is_new: !r.is_new }).eq("id", r.id);
                      if (error) toast.error(error.message); else load();
                    }}
                    className="p-1.5 rounded hover:bg-muted"
                    title={r.is_new ? "Remover etiqueta Novo" : "Marcar como Novo"}
                  >
                    <Sparkles className={`h-4 w-4 ${r.is_new ? "text-teal-600" : "text-muted-foreground"}`} />
                  </button>
                  <Switch checked={r.visible} onCheckedChange={() => toggleVisible(r)} />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing({ ...r }); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>


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
