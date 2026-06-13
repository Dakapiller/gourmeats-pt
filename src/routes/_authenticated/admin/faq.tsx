import { createFileRoute } from "@tanstack/react-router";
import { ListAdmin } from "@/components/admin/SectionAdmin";

export const Route = createFileRoute("/_authenticated/admin/faq")({
  component: () => (
    <ListAdmin
      table="faq_items"
      title="FAQ"
      description="Perguntas frequentes na landing."
      fields={[
        { name: "question", label: "Pergunta", required: true },
        { name: "answer", label: "Resposta", type: "textarea", required: true },
      ]}
      renderPreview={(r) => (
        <div>
          <p className="font-semibold text-sm">{r.question}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.answer}</p>
        </div>
      )}
    />
  ),
});
