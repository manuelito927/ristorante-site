export async function onRequestGet({ env }) {
  // serve solo per vedere se il file nuovo è davvero in produzione
  return new Response(JSON.stringify({
    ok: true,
    version: "covers-v3",
    hasCOVERS: !!env.COVERS
  }), {
    headers: { "content-type": "application/json" }
  });
}

export async function onRequestPut({ request, env }) {
  const body = await request.json();

  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (!env.COVERS) {
    return new Response(JSON.stringify({ error: "COVERS binding missing" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  // scrive e poi rilegge subito per conferma
  const written = {};
  for (const page in body) {
    const key = page.toUpperCase();
    await env.COVERS.put(key, body[page]);
    written[key] = await env.COVERS.get(key);
  }

  return new Response(JSON.stringify({
    ok: true,
    version: "covers-v3",
    written
  }), {
    headers: { "content-type": "application/json" }
  });
}