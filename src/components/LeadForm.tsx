import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/lib/leads.functions";

type FormState = "idle" | "loading" | "success" | "error";

export function LeadForm() {
  const submit = useServerFn(submitLead);
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();

    const newInvalid: Record<string, boolean> = {};
    if (!name) newInvalid.name = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newInvalid.email = true;
    if (Object.keys(newInvalid).length) {
      setInvalid(newInvalid);
      return;
    }

    setState("loading");
    try {
      await submit({
        data: {
          name,
          email,
          restaurant: (fd.get("restaurant") as string)?.trim(),
          phone: (fd.get("phone") as string)?.trim(),
          message: (fd.get("message") as string)?.trim(),
        },
      });
      (e.target as HTMLFormElement).reset();
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar. Tente novamente.");
      setState("error");
    }
  }

  function clearInvalid(field: string) {
    setInvalid((prev) => ({ ...prev, [field]: false }));
  }

  return (
    <section id="contact">
      <div className="wrap-sm">
        <div className="contact-hd">
          <span className="hero-kicker">Prefere que lhe escrevamos nós</span>
          <h2 className="contact-h2">Deixe os seus contactos</h2>
          <p className="contact-sub">Respondemos em menos de 24 horas, sem compromisso.</p>
        </div>
        <form className="lead-form" onSubmit={handleSubmit} noValidate>
          <div className="lead-row">
            <div className="lead-field">
              <label htmlFor="lf-name">Nome *</label>
              <input
                type="text"
                id="lf-name"
                name="name"
                placeholder="O seu nome"
                className={invalid.name ? "is-invalid" : ""}
                onChange={() => clearInvalid("name")}
                autoComplete="name"
              />
            </div>
            <div className="lead-field">
              <label htmlFor="lf-email">Email *</label>
              <input
                type="email"
                id="lf-email"
                name="email"
                placeholder="email@restaurante.pt"
                className={invalid.email ? "is-invalid" : ""}
                onChange={() => clearInvalid("email")}
                autoComplete="email"
              />
            </div>
          </div>
          <div className="lead-row">
            <div className="lead-field">
              <label htmlFor="lf-restaurant">Restaurante</label>
              <input
                type="text"
                id="lf-restaurant"
                name="restaurant"
                placeholder="Nome do restaurante"
                autoComplete="organization"
              />
            </div>
            <div className="lead-field">
              <label htmlFor="lf-phone">Telefone</label>
              <input
                type="tel"
                id="lf-phone"
                name="phone"
                placeholder="+351 9xx xxx xxx"
                autoComplete="tel"
              />
            </div>
          </div>
          <div className="lead-field">
            <label htmlFor="lf-message">Mensagem (opcional)</label>
            <textarea
              id="lf-message"
              name="message"
              placeholder="Alguma dúvida ou contexto que queira partilhar?"
              rows={3}
            />
          </div>
          <div className="lead-form-foot">
            <button type="submit" className="lead-submit" disabled={state === "loading"}>
              {state === "loading" ? (
                <span className="lead-submit-spin" aria-hidden="true" />
              ) : (
                <span className="lead-submit-txt">Enviar mensagem</span>
              )}
            </button>
            <p className="lead-privacy">
              Os seus dados são usados apenas para lhe responder. Nunca partilhamos com terceiros.
            </p>
          </div>
          {state === "success" && (
            <div className="lead-msg lead-msg--ok" role="alert">
              ✓ Mensagem enviada! Entramos em contacto brevemente.
            </div>
          )}
          {state === "error" && (
            <div className="lead-msg lead-msg--err" role="alert">
              {errorMsg}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
