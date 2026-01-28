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
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .toLowerCase();
}

export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Payload non valido" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  // ✅ lista “ufficiale” delle pagine che gestisci
  const keys = ["home", "menu", "gallery", "prenota", "come_funziona", "recensioni"];

  // 1) leggi copertine esistenti
  const current = {};
  for (const k of keys) {
    current[k] = (await env.COVERS.get(k)) || "";
  }

  // 2) aggiorna solo quelle passate
  for (const [page, url] of Object.entries(body)) {
    const key = normalizeCoverKey(page);
    if (!keys.includes(key)) continue; // evita chiavi strane
    const val = String(url || "").trim();
    if (val) current[key] = val;       // ✅ non sovrascrive con vuoto
  }

  // 3) risalva tutto (solo valori validi)
  for (const [k, v] of Object.entries(current)) {
    if (v) await env.COVERS.put(k, v);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}