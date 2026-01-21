export async function onRequestGet({ env }) {
  return new Response(
    JSON.stringify({
      hasBucket: !!env.BUCKET,
      bucketType: env.BUCKET ? typeof env.BUCKET : null
    }),
    { headers: { "content-type": "application/json" } }
  );
}