import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "url" | "number" | "image";
  required?: boolean;
  placeholder?: string;
  bucket?: string; // for type "image"
};

function ImageField({
  value,
  onChange,
  bucket,
}: {
  value: string;
  onChange: (url: string) => void;
  bucket: string;
}) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
    if (signErr || !signed) {
      toast.error(signErr?.message ?? "Não foi possível gerar URL");
      setUploading(false);
      return;
    }
    onChange(signed.signedUrl);
    setUploading(false);
  };
  return (
    <div className="space-y-2">
      {value && (
        <img
          src={value}
          alt="preview"
          className="w-20 h-20 rounded-md object-cover border"
        />
      )}
      <Input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Input
        type="url"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ou cola um URL"
      />
    </div>
  );
}

type Row = Record<string, any> & { id: string; sort_order: number; visible?: boolean };

export function ListAdmin({
  table,
  title,
  description,
  fields,
  hasVisible = true,
  renderPreview,
}: {
  table: string;
  title: string;
  description?: string;
  fields: Field[];
  hasVisible?: boolean;
  renderPreview?: (r: Row) => React.ReactNode;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(table as never)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const startNew = () => {
    const blank: Row = {
      id: "",
      sort_order: (rows[rows.length - 1]?.sort_order ?? 0) + 1,
      visible: true,
    };
    for (const f of fields) blank[f.name] = "";
    setEditing(blank);
    setOpen(true);
  };

  const startEdit = (row: Row) => {
    setEditing({ ...row });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const payload: Record<string, any> = { sort_order: editing.sort_order };
    if (hasVisible) payload.visible = editing.visible ?? true;
    for (const f of fields) {
      payload[f.name] = f.type === "number" ? Number(editing[f.name]) : editing[f.name];
    }
    let error;
    if (editing.id) {
      ({ error } = await supabase
        .from(table as never)
        .update(payload as never)
        .eq("id", editing.id));
    } else {
      ({ error } = await supabase.from(table as never).insert(payload as never));
    }
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Guardado");
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Apagar este item?")) return;
    const { error } = await supabase
      .from(table as never)
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removido");
      load();
    }
  };

  const move = async (row: Row, dir: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const other = rows[idx + dir];
    if (!other) return;
    await Promise.all([
      supabase
        .from(table as never)
        .update({ sort_order: other.sort_order } as never)
        .eq("id", row.id),
      supabase
        .from(table as never)
        .update({ sort_order: row.sort_order } as never)
        .eq("id", other.id),
    ]);
    load();
  };

  const toggleVisible = async (row: Row) => {
    await supabase
      .from(table as never)
      .update({ visible: !row.visible } as never)
      .eq("id", row.id);
    load();
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startNew}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Editar" : "Adicionar"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4 py-2">
                {fields.map((f) => (
                  <div key={f.name} className="space-y-1.5">
                    <Label htmlFor={f.name}>{f.label}</Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        id={f.name}
                        value={editing[f.name] ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, [f.name]: e.target.value })
                        }
                        placeholder={f.placeholder}
                        rows={4}
                        required={f.required}
                      />
                    ) : f.type === "image" ? (
                      <ImageField
                        value={editing[f.name] ?? ""}
                        onChange={(url) => setEditing({ ...editing, [f.name]: url })}
                        bucket={f.bucket ?? "restaurant-logos"}
                      />
                    ) : (
                      <Input
                        id={f.name}
                        type={f.type ?? "text"}
                        value={editing[f.name] ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, [f.name]: e.target.value })
                        }
                        placeholder={f.placeholder}
                        required={f.required}
                      />
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <Label htmlFor="sort">Ordem</Label>
                  <Input
                    id="sort"
                    type="number"
                    className="w-24"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing({ ...editing, sort_order: Number(e.target.value) })
                    }
                  />
                  {hasVisible && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Switch
                        id="visible"
                        checked={editing.visible ?? true}
                        onCheckedChange={(v) => setEditing({ ...editing, visible: v })}
                      />
                      <Label htmlFor="visible">Visível</Label>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Sem registos. Clica em Adicionar para começar.
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <Card key={r.id} className="p-4 flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <button
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  onClick={() => move(r, -1)}
                  disabled={i === 0}
                  aria-label="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  onClick={() => move(r, 1)}
                  disabled={i === rows.length - 1}
                  aria-label="Descer"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                {renderPreview ? (
                  renderPreview(r)
                ) : (
                  <div className="space-y-1">
                    {fields.slice(0, 2).map((f) => (
                      <div key={f.name} className="text-sm truncate">
                        <span className="text-muted-foreground text-xs mr-2">{f.label}:</span>
                        {String(r[f.name] ?? "")}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasVisible && (
                  <Switch
                    checked={r.visible ?? true}
                    onCheckedChange={() => toggleVisible(r)}
                  />
                )}
                <Button size="icon" variant="ghost" onClick={() => startEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(r.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Singleton record editor (one row identified by id=1)
export function SingletonAdmin({
  table,
  title,
  description,
  fields,
}: {
  table: string;
  title: string;
  description?: string;
  fields: Field[];
}) {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from(table as never)
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data: d }) => setData((d as unknown as Record<string, any>) ?? { id: 1 }));
  }, [table]);

  if (!data) return <p className="text-sm text-muted-foreground">A carregar…</p>;

  const save = async () => {
    setSaving(true);
    const payload: Record<string, any> = {};
    for (const f of fields) payload[f.name] = data[f.name];
    const { error } = await supabase
      .from(table as never)
      .update(payload as never)
      .eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Guardado");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
      <Card className="p-6 space-y-4">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label htmlFor={f.name}>{f.label}</Label>
            {f.type === "textarea" ? (
              <Textarea
                id={f.name}
                value={data[f.name] ?? ""}
                onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
                rows={3}
                placeholder={f.placeholder}
              />
            ) : (
              <Input
                id={f.name}
                type={f.type ?? "text"}
                value={data[f.name] ?? ""}
                onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
                placeholder={f.placeholder}
              />
            )}
          </div>
        ))}
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "A guardar…" : "Guardar alterações"}
        </Button>
      </Card>
    </div>
  );
}
