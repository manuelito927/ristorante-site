const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  // Legge lo stato da KV (binding: COVERS)
  const raw = await env.COVERS.get("BOOKING_ENABLED");

  // Default: ON se la chiave non esiste ancora
  const enabled =
    raw === null ? true : String(raw).toLowerCase() === "true";

  return new Response(JSON.stringify({ enabled }), {
    headers: { "content-type": "application/json", ...CORS },
  });
}