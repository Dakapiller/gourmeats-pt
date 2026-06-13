import { createFileRoute } from "@tanstack/react-router";
import { ListAdmin } from "@/components/admin/SectionAdmin";

export const Route = createFileRoute("/_authenticated/admin/proof")({
  component: () => (
    <ListAdmin
      table="proof_cards"
      title="Depoimentos"
      description="Citações de clientes que aparecem na secção de prova social."
      fields={[
        { name: "quote", label: "Citação", type: "textarea", required: true },
        { name: "author_name", label: "Nome", required: true },
        { name: "author_role", label: "Restaurante / cargo", required: true },
      ]}
      renderPreview={(r) => (
        <div>
          <p className="text-sm italic line-clamp-2">"{r.quote}"</p>
          <p className="text-xs text-muted-foreground mt-1">
            — {r.author_name}, {r.author_role}
          </p>
        </div>
      )}
    />
  ),
});
