import { createFileRoute } from "@tanstack/react-router";
import { ListAdmin } from "@/components/admin/SectionAdmin";

export const Route = createFileRoute("/_authenticated/admin/features")({
  component: () => (
    <ListAdmin
      table="features"
      title="Features / Benefícios"
      description="Cartões de funcionalidades do produto."
      fields={[
        { name: "icon", label: "Ícone (texto identificador: video, qr, languages, edit, analytics, support)" },
        { name: "title", label: "Título", required: true },
        { name: "description", label: "Descrição", type: "textarea", required: true },
      ]}
      renderPreview={(r) => (
        <div>
          <p className="font-semibold text-sm">{r.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
        </div>
      )}
    />
  ),
});
