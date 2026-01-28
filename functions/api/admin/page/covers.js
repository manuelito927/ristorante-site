const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// normalizza: "come-funziona" → "come_funziona"
function normalizeKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Payload non valido" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  const ALLOWED = [
    "home",
    "menu",
    "gallery",
    "prenota",
    "come_funziona",
    "recensioni",
  ];

  // 1️⃣ carica stato attuale
  const current = {};
  for (const key of ALLOWED) {
    current[key] = (await env.COVERS.get(key)) || "";
  }

  // 2️⃣ aggiorna solo le chiavi valide
  for (const [rawKey, rawUrl] of Object.entries(body)) {
    const key = normalizeKey(rawKey);
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

    if (ALLOWED.includes(key) && url) {
      current[key] = url;
    }
  }

  // 3️⃣ salva tutto
  for (const [k, v] of Object.entries(current)) {
    await env.COVERS.put(k, v);
  }

  return new Response(JSON.stringify({ ok: true, data: current }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}