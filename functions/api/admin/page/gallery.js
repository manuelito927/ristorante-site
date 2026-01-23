// functions/api/admin/page/gallery.js

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  if (!env.COVERS) {
    return new Response(JSON.stringify({ error: "COVERS binding missing" }), {
      status: 500,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  const raw = await env.COVERS.get("GALLERY_LIST");
  let urls = [];
  try {
    urls = raw ? JSON.parse(raw) : [];
  } catch (_) {
    urls = [];
  }

  return new Response(JSON.stringify({ urls }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}

export async function onRequestPut({ request, env }) {
  if (!env.COVERS) {
    return new Response(JSON.stringify({ error: "COVERS binding missing" }), {
      status: 500,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  const body = await request.json().catch(() => ({}));
  const urls = Array.isArray(body.urls) ? body.urls : [];

  await env.COVERS.put("GALLERY_LIST", JSON.stringify(urls));

  return new Response(JSON.stringify({ ok: true, urls }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}