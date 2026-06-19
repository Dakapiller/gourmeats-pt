import { createServerFn } from "@tanstack/react-start";

type LeadInput = {
  name: string;
  email: string;
  restaurant?: string;
  phone?: string;
  message?: string;
};

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadInput) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any).from("leads").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      restaurant: data.restaurant?.trim() || null,
      phone: data.phone?.trim() || null,
      message: data.message?.trim() || null,
      source: "landing",
    });

    if (error) {
      console.error("Lead insert error:", error);
      throw new Error("Erro ao guardar. Tente novamente.");
    }

    try {
      await appendLeadToSheet(data);
    } catch (err) {
      console.error("Google Sheets append failed (non-fatal):", err);
    }

    return { ok: true };
  });

async function appendLeadToSheet(lead: LeadInput) {
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
  if (!access_token) throw new Error("Failed to obtain Google access token");

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
