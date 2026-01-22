export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const key = u.searchParams.get("key");

  if (!key) return new Response("Missing key", { status: 400 });

  if (!env || !env.BUCKET) return new Response("BUCKET binding missing", { status: 500 });

  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  if (obj.httpMetadata && obj.httpMetadata.contentType) {
    headers.set("content-type", obj.httpMetadata.contentType);
  }
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
}