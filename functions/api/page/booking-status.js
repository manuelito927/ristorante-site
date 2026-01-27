const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  const raw = await env.COVERS.get("BOOKING_ENABLED");
  const enabled = raw === null ? true : String(raw).toLowerCase() === "true";

  return new Response(JSON.stringify({ enabled }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}

export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const enabled = !!body.enabled;

  await env.COVERS.put("BOOKING_ENABLED", String(enabled));

  return new Response(JSON.stringify({ ok: true, enabled }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}