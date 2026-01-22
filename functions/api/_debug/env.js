.export async function onRequestGet({ env }) {
  return new Response(
    JSON.stringify({
      hasEnv: !!env,
      envKeys: env ? Object.keys(env) : [],
      hasBucket: !!env?.BUCKET,
      bucketType: env?.BUCKET ? typeof env.BUCKET : null
    }, null, 2),
    { headers: { "content-type": "application/json" } }
  );
}