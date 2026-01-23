export async function onRequestGet({ env }) {
  if (!env.COVERS) {
    return new Response(JSON.stringify({ error: "COVERS binding missing" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const raw = await env.COVERS.get("GALLERY_LIST");
  const urls = raw ? JSON.parse(raw) : [];

  return new Response(JSON.stringify({ urls }), {
    headers: { "content-type": "application/json" },
  });
}