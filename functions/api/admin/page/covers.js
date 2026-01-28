const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

function normalizeKey(k) {
  return String(k || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

const ALLOWED = new Set([
  "home",
  "menu",
  "gallery",
  "prenota",
  "come_funziona",
  "recensioni",
]);

export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Payload non valido" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  // ✅ Caso A (vecchio): { page, url }
  if ("page" in body || "url" in body) {
    const page = normalizeKey(body.page);
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!page || !url) {
      return new Response(JSON.stringify({ error: "page o url mancanti" }), {
        status: 400,
        headers: { "content-type": "application/json", ...CORS },
      });
    }
    if (!ALLOWED.has(page)) {
      return new Response(JSON.stringify({ error: "pagina non valida" }), {
        status: 400,
        headers: { "content-type": "application/json", ...CORS },
      });
    }

    await env.COVERS.put(page, url);
    return new Response(JSON.stringify({ ok: true, updated: [page] }), {
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  // ✅ Caso B (nuovo): { home:"...", menu:"...", ... }
  const updated = [];
  const ignored = [];

  for (const [k, v] of Object.entries(body)) {
    const key = normalizeKey(k);
    const url = typeof v === "string" ? v.trim() : "";

    // ignora chiavi non permesse
    if (!ALLOWED.has(key)) {
      ignored.push(k);
      continue;
    }

    // ignora valori vuoti (NON sovrascrive)
    if (!url) continue;

    await env.COVERS.put(key, url);
    updated.push(key);
  }

  if (updated.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "Nessun campo valido da salvare", ignored }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  return new Response(JSON.stringify({ ok: true, updated, ignored }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}