export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  const obj = await env.BUCKET.get(key);

  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  // content-type corretto se presente
  if (obj.httpMetadata?.contentType) {
    headers.set("content-type", obj.httpMetadata.contentType);
  }

  // cache aggressiva (puoi cambiare dopo)
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
}