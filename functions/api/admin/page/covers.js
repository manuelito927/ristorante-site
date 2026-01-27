const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

function normalizeCoverKey(page) {
  return String(page || "")
    .trim()
    .replace(/\s+/g, "_")   // spazi -> underscore
    .replace(/-/g, "_")     // trattini -> underscore  ✅ come-funziona -> come_funziona
    .toUpperCase();         // -> COME_FUNZIONA
}

export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => ({}));

  const entries = Object.entries(body || {});
  if (!entries.length) {
    return new Response(JSON.stringify({ error: "Nessuna copertina fornita" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  for (const [page, url] of entries) {
    const key = normalizeCoverKey(page);
    const val = String(url || "").trim();

    if (!key) continue;
    await env.COVERS.put(key, val);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}