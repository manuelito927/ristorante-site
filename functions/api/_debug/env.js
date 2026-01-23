export async function onRequestGet({ env }) {
  const keys = env ? Object.keys(env) : [];
  return new Response(JSON.stringify({ keys, hasBUCKET: !!env?.BUCKET, hasCOVERS: !!env?.COVERS }), {
    headers: { "content-type": "application/json" },
  });
}