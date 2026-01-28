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

  const pages = [
    "home",
    "menu",
    "gallery",
    "prenota",
    "come_funziona",
    "recensioni",
  ];

  // 1️⃣ leggi copertine esistenti
  const current = {};
  for (const p of pages) {
    current[p] = (await env.COVERS.get(p)) || "";
  }

  // 2️⃣ aggiorna solo quelle passate
  for (const [page, url] of Object.entries(body)) {
    const key = normalizeCoverKey(page);
    if (key in current) {
      current[key] = String(url || "").trim();
    }
  }

  // 3️⃣ risalva tutto
  for (const [k, v] of Object.entries(current)) {
    await env.COVERS.put(k, v);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}