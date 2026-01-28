const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  const [home, menu, gallery, prenota, comeFunziona, recensioni] = await Promise.all([
    env.COVERS.get("home"),
    env.COVERS.get("menu"),
    env.COVERS.get("gallery"),
    env.COVERS.get("prenota"),
    env.COVERS.get("come_funziona"),
    env.COVERS.get("recensioni"),
  ]);

  return new Response(
    JSON.stringify({
      home: home || "",
      menu: menu || "",
      gallery: gallery || "",
      prenota: prenota || "",
      "come-funziona": comeFunziona || "",
      recensioni: recensioni || "",
    }),
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        ...CORS,
      },
    }
  );
}