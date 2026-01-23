export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const urls = Array.isArray(body.urls) ? body.urls : [];

  if (!env.COVERS) {
    return new Response(JSON.stringify({ error: "COVERS binding missing" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // salviamo la lista foto gallery dentro KV
  await env.COVERS.put("GALLERY_LIST", JSON.stringify(urls));

  return new Response(JSON.stringify({ ok: true, count: urls.length }), {
    headers: { "content-type": "application/json" },
  });
}