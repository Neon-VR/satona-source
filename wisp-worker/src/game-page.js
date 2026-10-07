// Serve third-party game documents on the relay origin, never in Satona srcdoc.
export async function gamePage(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  const folder = url.searchParams.get("folder");
  const file = url.searchParams.get("file");
  if (request.method !== "GET")
    return new Response("Method not allowed", { status: 405 });
  if (
    (folder && !/^\d+$/.test(folder)) ||
    (!folder && !/^\d+(?:-[a-zA-Z0-9_-]+)?\.html$/.test(file || ""))
  )
    return new Response("Unknown game", { status: 400 });
  const path = folder
    ? `assets/main/${folder}/index.html`
    : `html/main/${file}`;
  const upstream = `https://raw.githubusercontent.com/gn-math/${path}`;
  const base = folder
    ? `https://cdn.jsdelivr.net/gh/gn-math/assets@main/${folder}/`
    : upstream;
  try {
    const result = await fetcher(upstream, {
      signal: AbortSignal.timeout(20000),
    });
    if (!result.ok)
      return new Response(
        "This game could not load. Return to Satona Steam and try again.",
        { status: 502 },
      );
    let html = await result.text();
    if (!/<base\b/i.test(html)) {
      html = /<head\b[^>]*>/i.test(html)
        ? html.replace(
            /<head\b[^>]*>/i,
            (head) => `${head}<base href="${base}">`,
          )
        : `<base href="${base}">${html}`;
    }
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": `frame-ancestors ${env.ALLOWED_ORIGINS.split(",").join(" ")};`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response(
      "The game server did not respond. Return to Satona Steam and try again.",
      { status: 502 },
    );
  }
}
