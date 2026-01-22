export async function onRequestPut({ request, env }) {
  const body = await request.json();

  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  // 🔴 QUESTA ERA LA PARTE MANCANTE
  for (const page in body) {
    await env.COVERS.put(page.toUpperCase(), body[page]);
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { headers: { "content-type": "application/json" } }
  );
}