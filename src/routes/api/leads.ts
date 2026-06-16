import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const { name, email, restaurant, phone, message } = body as Record<string, string>;

        if (!name?.trim() || !email?.trim()) {
          return Response.json({ error: "Nome e email são obrigatórios." }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          return Response.json({ error: "Email inválido." }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any).from("leads").insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          restaurant: restaurant?.trim() || null,
          phone: phone?.trim() || null,
          message: message?.trim() || null,
          source: "landing",
        });

        if (error) {
          console.error("Lead insert error:", error);
          return Response.json({ error: "Erro ao guardar. Tente novamente." }, { status: 500 });
        }

        try {
          await appendLeadToSheet({ name, email, restaurant, phone, message });
        } catch (err) {
          // Non-fatal: lead already saved in Supabase
          console.error("Google Sheets append failed:", err);
        }

        return Response.json({ ok: true });
      },
    },
  },
});

async function appendLeadToSheet(lead: {
  name: string;
  email: string;
  restaurant?: string;
  phone?: string;
  message?: string;
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  if (!clientId || !clientSecret || !refreshToken || !sheetId) return;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Failed to obtain access token");

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:G:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [
          [
            lead.name,
            lead.email,
            lead.restaurant ?? "",
            lead.phone ?? "",
            lead.message ?? "",
            "landing",
            new Date().toISOString(),
          ],
        ],
      }),
    },
  );
}
