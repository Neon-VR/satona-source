import { authenticate, accountHeaders } from "./account-auth.js";
const MAX_BYTES = 1_500_000;
export async function accountSync(request, env, verifyUser = authenticate) {
  const headers = accountHeaders(request, env);
  if (!headers) return new Response("Origin not allowed", { status: 403 });
  const reply = (body, status = 200) =>
    Response.json(body, { status, headers });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (!["GET", "HEAD", "PUT"].includes(request.method))
    return reply({ error: "Method not allowed" }, 405);
  if (!env.ACCOUNTS)
    return reply({ error: "Account sync is not configured yet." }, 503);
  if (request.method === "HEAD")
    return new Response(null, { status: 204, headers });
  let user;
  try {
    user = await verifyUser(request, env);
  } catch {
    return reply({ error: "Account service is temporarily unavailable." }, 503);
  }
  if (!user)
    return reply({ error: "Your session expired. Sign in again." }, 401);
  try {
    if (request.method === "GET") {
      const row = await env.ACCOUNTS.prepare(
        "SELECT payload, revision, updated_at FROM browser_vaults WHERE user_id = ?",
      )
        .bind(user.id)
        .first();
      return reply(
        row
          ? {
              vault: JSON.parse(row.payload),
              revision: row.revision,
              updatedAt: row.updated_at,
            }
          : { vault: null, revision: 0 },
      );
    }
    if (Number(request.headers.get("Content-Length")) > MAX_BYTES)
      return reply({ error: "Backup exceeds 1 MB." }, 413);
    // Bound streamed bodies as well as requests with a Content-Length header.
    const reader = request.body?.getReader();
    let size = 0;
    const chunks = [];
    if (!reader) return reply({ error: "Missing backup." }, 400);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return reply({ error: "Backup exceeds 1 MB." }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let input;
    try {
      input = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return reply({ error: "Invalid backup." }, 400);
    }
    const v = input?.vault;
    if (
      !Number.isSafeInteger(input?.revision) ||
      input.revision < 0 ||
      v?.version !== 1 ||
      !/^[A-Za-z0-9+/]{16}$/.test(v.iv || "") ||
      typeof v.ciphertext !== "string" ||
      v.ciphertext.length < 24 ||
      v.ciphertext.length > 1_400_000 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(v.ciphertext)
    )
      return reply({ error: "Invalid encrypted backup." }, 400);
    const payload = JSON.stringify({
      version: 1,
      iv: v.iv,
      ciphertext: v.ciphertext,
    });
    const updatedAt = new Date().toISOString();
    const result =
      input.revision === 0
        ? await env.ACCOUNTS.prepare(
            "INSERT OR IGNORE INTO browser_vaults (user_id, payload, revision, updated_at) VALUES (?, ?, 1, ?)",
          )
            .bind(user.id, payload, updatedAt)
            .run()
        : await env.ACCOUNTS.prepare(
            "UPDATE browser_vaults SET payload = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ?",
          )
            .bind(payload, updatedAt, user.id, input.revision)
            .run();
    if (!result.meta.changes)
      return reply(
        {
          error:
            "Another device updated your backup. Restore its latest version before saving.",
          conflict: true,
        },
        409,
      );
    return reply({ revision: input.revision + 1, updatedAt });
  } catch {
    return reply({ error: "Could not access your backup. Try again." }, 503);
  }
}
