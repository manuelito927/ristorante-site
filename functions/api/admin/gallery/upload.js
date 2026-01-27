// functions/api/admin/gallery/upload.js

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

async function handleUpload(request, env) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  if (!env?.BUCKET) {
    return new Response(JSON.stringify({ error: "BUCKET binding missing" }), {
      status: 500,
      headers: { "content-type": "application/json", ...CORS },
    });
  }

  const key = `uploads/${Date.now()}-${file.name}`;

  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const origin = env.CF_PAGES_URL;
  const url = `${origin}/api/public/image?key=${encodeURIComponent(key)}`;

  return new Response(JSON.stringify({ ok: true, key, url }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}

export async function onRequestPost(ctx) {
  return handleUpload(ctx.request, ctx.env);
}

export async function onRequestPut(ctx) {
  return handleUpload(ctx.request, ctx.env);
}

export async function onRequestGet() {
  return new Response("ADMIN UPLOAD OK", { status: 200, headers: CORS });
}