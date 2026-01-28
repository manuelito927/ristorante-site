const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Payload non valido" }), { status: 400 });
  }

  const keys = ["home", "menu", "gallery", "prenota", "come_funziona", "recensioni"];
  const current = {};

  // 1️⃣ leggi copertine esistenti
  for (const k of keys) {
    current[k] = (await env.COVERS.get(k)) || "";
  }

  // 2️⃣ aggiorna solo quelle passate
  for (const [page, url] of Object.entries(body)) {
    const key = normalizeCoverKey(page);
    current[key] = String(url || "").trim();
  }

  // 3️⃣ risalva tutto
  for (const [k, v] of Object.entries(current)) {
    await env.COVERS.put(k, v);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}