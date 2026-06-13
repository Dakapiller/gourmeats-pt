import { createFileRoute } from "@tanstack/react-router";
import { ListAdmin } from "@/components/admin/SectionAdmin";

export const Route = createFileRoute("/_authenticated/admin/metrics")({
  component: () => (
    <ListAdmin
      table="metrics"
      title="Métricas de impacto"
      description="Números grandes que mostram o impacto do Gourmeats."
      fields={[
        { name: "value", label: "Valor (ex: +25%, 3×, 0)", required: true },
        { name: "description", label: "Descrição", type: "textarea", required: true },
      ]}
      renderPreview={(r) => (
        <div>
          <span className="font-extrabold text-2xl" style={{ color: "#7A6200" }}>
            {r.value}
          </span>
          <span className="text-sm text-muted-foreground ml-3">{r.description}</span>
        </div>
      )}
    />
  ),
});
