export async function onRequestPost({ request, env }) {
  // ❗ TEMP: bypass auth per test
  // (lo rimettiamo dopo)

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response(
      JSON.stringify({ error: "No file provided" }),
      { status: 400 }
    );
  }

  if (!env.BUCKET) {
    return new Response(
      JSON.stringify({ error: "BUCKET binding missing" }),
      { status: 500 }
    );
  }

  const key = `uploads/${Date.now()}-${file.name}`;

  await env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  return new Response(
    JSON.stringify({
      ok: true,
      key
    }),
    { headers: { "content-type": "application/json" } }
  );
}