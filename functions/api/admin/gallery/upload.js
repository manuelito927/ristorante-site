export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // (più compatibile di file.stream())
    const bytes = await file.arrayBuffer();

    const safeName = (file.name || "upload").replace(/[^\w.\-]+/g, "_");
    const key = `uploads/${Date.now()}-${safeName}`;

    await env.BUCKET.put(key, bytes, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    // metti questa variabile in Pages -> Settings -> Variables
    // es: https://ristorante-images.<tuo-dominio-r2>
    const publicBase = env.R2_PUBLIC_URL || "";
    const url = publicBase ? `${publicBase}/${key}` : key;

    return new Response(JSON.stringify({ url, key }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}