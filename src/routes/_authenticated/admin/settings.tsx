import { createFileRoute } from "@tanstack/react-router";
import { SingletonAdmin } from "@/components/admin/SectionAdmin";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: () => (
    <SingletonAdmin
      table="site_settings"
      title="Definições do site"
      description="Contactos, metadados SEO e identificação geral."
      fields={[
        { name: "site_name", label: "Nome do site" },
        { name: "meta_title", label: "Title (SEO)" },
        { name: "meta_description", label: "Meta description", type: "textarea" },
        { name: "og_image_url", label: "URL da imagem de partilha (OG)", type: "url" },
        { name: "whatsapp_number", label: "Número WhatsApp (formato +351...)" },
        { name: "whatsapp_display", label: "WhatsApp para apresentar" },
        { name: "contact_email", label: "Email de contacto" },
        { name: "cta_message", label: "Mensagem pré-preenchida no WhatsApp", type: "textarea" },
      ]}
    />
  ),
});
