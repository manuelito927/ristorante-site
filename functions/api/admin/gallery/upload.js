export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (!env || !env.BUCKET) {
    return new Response(JSON.stringify({ error: "BUCKET binding missing" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  const key = `uploads/${Date.now()}-${file.name}`;

  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const url = `/api/public/image?key=${encodeURIComponent(key)}`;

  return new Response(JSON.stringify({ ok: true, key, url }), {
    headers: { "content-type": "application/json" }
  });
}