export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) return new Response("Missing key", { status: 400 });
  if (!env.BUCKET) return new Response("BUCKET missing", { status: 500 });

  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
"Cache-Control": "no-store"
    }
  });
}
