const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPut({ request, env }) {
  const { page, url } = await request.json().catch(() => ({}));

  if (!page || !url) {
    return new Response(JSON.stringify({ error: "page o url mancanti" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  const key = String(page).trim().toLowerCase(); // es: menu
  await env.COVERS.put(key, String(url).trim());

  return new Response(JSON.stringify({ ok: true, key }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}