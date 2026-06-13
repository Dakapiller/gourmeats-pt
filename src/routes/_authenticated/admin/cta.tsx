import { createFileRoute } from "@tanstack/react-router";
import { SingletonAdmin } from "@/components/admin/SectionAdmin";

export const Route = createFileRoute("/_authenticated/admin/cta")({
  component: () => (
    <SingletonAdmin
      table="cta_section"
      title="CTA final"
      description="Secção de conversão no fim da landing."
      fields={[
        { name: "headline", label: "Título", type: "textarea" },
        { name: "subheadline", label: "Subtítulo", type: "textarea" },
        { name: "primary_cta_label", label: "Label do botão WhatsApp" },
      ]}
    />
  ),
});
