export async function onRequestPut({ request, env }) {
  const body = await request.json();

  // body sarà tipo: { home: "/api/public/image?key=..." }
  // oppure: { menu: "..." }

  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  // Qui per ora NON salviamo su DB (lo faremo dopo)
  // Rispondiamo solo OK per sbloccare la copertina

  return new Response(
    JSON.stringify({ ok: true }),
    { headers: { "content-type": "application/json" } }
  );
}