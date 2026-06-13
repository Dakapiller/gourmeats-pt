import { createFileRoute } from "@tanstack/react-router";
import { SingletonAdmin, ListAdmin } from "@/components/admin/SectionAdmin";

export const Route = createFileRoute("/_authenticated/admin/hero")({
  component: HeroAdmin,
});

function HeroAdmin() {
  return (
    <div className="space-y-12">
      <SingletonAdmin
        table="hero_section"
        title="Hero principal"
        description="Texto da secção topo da landing."
        fields={[
          { name: "kicker", label: "Kicker (acima do título)" },
          { name: "headline", label: "Título (H1)", type: "textarea" },
          { name: "subheadline", label: "Subtítulo", type: "textarea" },
          { name: "primary_cta_label", label: "Label do CTA principal" },
          { name: "secondary_cta_label", label: "Label do CTA secundário" },
        ]}
      />
      <ListAdmin
        table="hero_stats"
        title="Estatísticas do hero"
        description="Pequenos cartões com números (ex: +25% ticket médio)."
        fields={[
          { name: "value", label: "Valor (ex: +25%, 26+)", required: true },
          { name: "label", label: "Descrição curta", required: true },
        ]}
        renderPreview={(r) => (
          <div className="flex items-baseline gap-3">
            <span className="font-extrabold text-lg" style={{ color: "#7A6200" }}>
              {r.value}
            </span>
            <span className="text-sm text-muted-foreground">{r.label}</span>
          </div>
        )}
      />
    </div>
  );
}
