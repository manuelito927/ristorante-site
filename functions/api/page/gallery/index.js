const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  const raw = await env.COVERS.get("GALLERY_LIST");
  const urls = raw ? JSON.parse(raw) : [];

  return new Response(JSON.stringify({
    data: { urls }
  }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}