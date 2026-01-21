export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "No file" }), { status: 400 });
  }

  const key = `uploads/${Date.now()}-${file.name}`;
  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const url = `https://YOUR_PUBLIC_R2_URL/${key}`;

  return new Response(JSON.stringify({ url }), {
    headers: { "content-type": "application/json" }
  });
}