const CORS = {
  "Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  const [home, menu, gallery, prenota, comeFunziona, recensioni] = await Promise.all([
    env.COVERS.get("HOME"),
    env.COVERS.get("HOME_CONTENT"),
    env.COVERS.get("MENU"),
    env.COVERS.get("GALLERY"),
    env.COVERS.get("PRENOTA"),
    env.COVERS.get("COME_FUNZIONA"),
    env.COVERS.get("RECENSIONI"),
  ]);

  return new Response(JSON.stringify({
    home: home || "",
    homeContent: homeContent ? JSON.parse(homeContent) : { title: "", body: "", images: [] }
    menu: menu || "",
    gallery: gallery || "",
    prenota: prenota || "",
    "come-funziona": comeFunziona || "",
    recensioni: recensioni || ""
  }), {
    headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS }
  });
}

export async function onRequestPut({ request, env }) {
  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return new Response("Unauthorized", { status: 401, headers: CORS });
  }

  const data = await request.json().catch(() => ({}));

  const homeData = {
    title: data.title || "",
    body: data.body || "",
    images: Array.isArray(data.images) ? data.images : []
  };

  await env.COVERS.put("HOME_CONTENT", JSON.stringify(homeData));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", ...CORS }
  });
}

