const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
"Access-Control-Allow-Headers": "Content-Type, Authorization",
};


export async function onRequestGet() {
  return new Response("UPLOAD ROUTE OK", { status: 200 });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
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