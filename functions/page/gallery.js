export async function onRequestGet({ env }) {
  const raw = await env.COVERS.get("GALLERY_LIST");
  const urls = raw ? JSON.parse(raw) : [];
  return new Response(JSON.stringify({ urls }), {
    headers: { "content-type": "application/json" }
  });
}
