import { validDestination } from "./wisp.js";

// Workers cannot open raw TCP sockets to Cloudflare addresses. Fetch can reach
// those public HTTP sites while preserving certificate verification.
export async function relayHttp(request, env, fetchUpstream = fetch) {
  const origin = request.headers.get("Origin");
  if (!origin || !env.ALLOWED_ORIGINS.split(",").includes(origin)) {
    return new Response("Origin not allowed", { status: 403 });
  }
  const cors = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Satona-Metadata",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  const fail = (message, status) =>
    new Response(message, { status, headers: cors });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return fail("Use POST", 405);
  let input;
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail("Missing request", 400);
    let text = "";
    let size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1500000) {
        await reader.cancel();
        return fail("Request too large", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    input = JSON.parse(text + decoder.decode());
    const target = new URL(input.url);
    if (
      !["https:", "http:"].includes(target.protocol) ||
      target.username ||
      target.password ||
      target.hostname === new URL(request.url).hostname ||
      !validDestination(
        target.hostname,
        Number(target.port || (target.protocol === "https:" ? 443 : 80)),
      )
    ) {
      return fail("Destination not allowed", 400);
    }
    const videoReadPost =
      input.method === "POST" &&
      target.protocol === "https:" &&
      ((/\.googlevideo\.com$/.test(target.hostname) &&
        target.pathname === "/videoplayback") ||
        (/^(www\.|m\.)?youtube\.com$/.test(target.hostname) &&
          /^\/youtubei\/v1\/(player|next|browse|search|updated_metadata|guide|att\/get)$/.test(
            target.pathname,
          )));
    if (!["GET", "HEAD"].includes(input.method) && !videoReadPost)
      return fail("Only GET and HEAD can be retried", 405);
    let body;
    if (input.bodyBase64 !== undefined) {
      if (!videoReadPost || typeof input.bodyBase64 !== "string")
        return fail("Body not allowed", 400);
      try {
        body = Uint8Array.from(atob(input.bodyBase64), (c) => c.charCodeAt(0));
      } catch {
        return fail("Invalid body", 400);
      }
      if (body.length > 1048576) return fail("Request too large", 413);
    }
    if (
      !Array.isArray(input.headers) ||
      input.headers.some(
        (pair) =>
          !Array.isArray(pair) ||
          pair.length !== 2 ||
          pair.some((value) => typeof value !== "string"),
      )
    ) {
      return fail("Invalid headers", 400);
    }
    const headers = new Headers(input.headers);
    for (const key of [
      "host",
      "connection",
      "upgrade",
      "content-length",
      "transfer-encoding",
      "proxy-authorization",
      "proxy-connection",
    ])
      headers.delete(key);
    headers.set("Accept-Encoding", "identity");
    // Identify the actual embedding app, as required by the YouTube player.
    // Scramjet's first navigation has no virtual referring page to forward.
    if (
      /^(www\.)?youtube\.com$/.test(target.hostname) &&
      target.pathname.startsWith("/embed/") &&
      !headers.has("Referer")
    )
      headers.set("Referer", `${origin}/`);
    const upstream = await fetchUpstream(target, {
      method: input.method,
      body,
      headers,
      redirect: "manual",
      signal: request.signal,
    });
    const rawHeaders = [...upstream.headers].filter(
      ([key]) =>
        ![
          "set-cookie",
          "content-encoding",
          "content-length",
          "transfer-encoding",
        ].includes(key.toLowerCase()),
    );
    for (const cookie of upstream.headers.getSetCookie())
      rawHeaders.push(["set-cookie", cookie]);
    const responseHeaders = new Headers(cors);
    responseHeaders.set("Content-Type", "application/octet-stream");
    responseHeaders.set(
      "X-Satona-Metadata",
      encodeURIComponent(
        JSON.stringify({
          status: upstream.status,
          statusText: upstream.statusText,
          headers: rawHeaders,
        }),
      ),
    );
    const encoding = upstream.headers.get("content-encoding");
    if (encoding) responseHeaders.set("Content-Encoding", encoding);
    return new Response(input.method === "HEAD" ? null : upstream.body, {
      headers: responseHeaders,
    });
  } catch {
    return fail("The HTTP relay could not reach this destination.", 502);
  }
}
