import { createFileRoute } from "@tanstack/react-router";
import { ListAdmin } from "@/components/admin/SectionAdmin";

export const Route = createFileRoute("/_authenticated/admin/restaurants")({
  component: () => (
    <ListAdmin
      table="restaurants"
      title="Restaurantes clientes"
      description="Lista de restaurantes que aparecem na secção de logos."
      fields={[
        { name: "name", label: "Nome do restaurante", required: true },
        { name: "logo_url", label: "URL do logo (quadrado)", type: "url" },
        { name: "link_url", label: "URL do site / Instagram", type: "url" },
      ]}
      renderPreview={(r) => (
        <div className="flex items-center gap-3">
          {r.logo_url ? (
            <img
              src={r.logo_url}
              alt={r.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted" />
          )}
          <div>
            <p className="font-semibold text-sm">{r.name}</p>
            {r.link_url && (
              <p className="text-xs text-muted-foreground truncate max-w-xs">{r.link_url}</p>
            )}
          </div>
        </div>
      )}
    />
  ),
});
