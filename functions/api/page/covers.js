export async function onRequestGet({ env }) {
  const home = await env.COVERS.get("HOME");

  return new Response(JSON.stringify({ home }), {
    headers: { "content-type": "application/json" }
  });
}