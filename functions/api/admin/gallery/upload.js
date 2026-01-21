export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const key = `uploads/${Date.now()}-${file.name}`;

    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    return new Response(JSON.stringify({
      success: true,
      key
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message
    }), { status: 500 });
  }
}