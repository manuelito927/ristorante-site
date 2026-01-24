const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPut({ request, env }) {
  const body = await request.json();

  const entries = Object.entries(body || {});
  if (!entries.length) {
    return new Response(JSON.stringify({ error: "Nessuna copertina fornita" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  for (const [page, url] of entries) {
    await env.COVERS.put(page.toUpperCase(), url);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}