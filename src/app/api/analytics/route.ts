import { NextRequest, NextResponse } from "next/server";

const TABLE = "whatsapp_bot_messages";
const SELECT = "id,whatsapp_mobile,profile_name,message_type,message_text,message_timestamp,received_at";

async function supabase(path: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");

  return fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}

export async function GET(request: NextRequest) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ configured: false, error: "Supabase is not configured." }, { status: 503 });
  }

  const params = request.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");
  try {
    const query = new URLSearchParams({
      select: SELECT,
      direction: "eq.incoming",
      order: "message_timestamp.desc.nullslast,received_at.desc",
      limit: "500",
    });
    if (from) query.set("message_timestamp", `gte.${from}`);
    if (to) query.append("message_timestamp", `lte.${to}`);
    const response = await supabase(`${TABLE}?${query.toString()}`);
    if (!response.ok) {
      console.error("Supabase analytics request failed", response.status, await response.text());
      return NextResponse.json({ configured: true, error: "Could not load analytics data." }, { status: 502 });
    }

    const messages = await response.json();
    return NextResponse.json(
      { configured: true, messages },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Analytics request failed", error);
    return NextResponse.json({ configured: true, error: "Could not reach Supabase." }, { status: 502 });
  }
}
