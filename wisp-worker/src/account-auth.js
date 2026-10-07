const text = new TextEncoder();
const label = text.encode("satona-password-verifier-v1");
const hex = (value) =>
  Array.from(value, (x) => x.toString(16).padStart(2, "0")).join("");
const bytes = (value) =>
  Uint8Array.from(value.match(/../g) || [], (x) => parseInt(x, 16));
const random = (size) => hex(crypto.getRandomValues(new Uint8Array(size)));
export const tokenHash = async (value) =>
  hex(
    new Uint8Array(await crypto.subtle.digest("SHA-256", text.encode(value))),
  );
async function passwordKey(proof, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    bytes(proof),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  // Client first derives a domain-separated proof with 600k PBKDF2 iterations.
  // The Worker adds a random salt and 100k iterations within its Web Crypto limit.
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: bytes(salt), iterations: 100000 },
    material,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"],
  );
}
export async function makeVerifier(proof, salt) {
  return hex(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", await passwordKey(proof, salt), label),
    ),
  );
}
export async function checkVerifier(proof, salt, verifier) {
  return crypto.subtle.verify(
    "HMAC",
    await passwordKey(proof, salt),
    bytes(verifier),
    label,
  );
}
export async function authenticate(request, env) {
  const token = (request.headers.get("Authorization") || "").match(
    /^Bearer ([a-f0-9]{64})$/,
  )?.[1];
  if (!token) return null;
  const row = await env.ACCOUNTS.prepare(
    "SELECT user_id FROM account_sessions WHERE token_hash = ? AND expires_at > ?",
  )
    .bind(await tokenHash(token), Date.now())
    .first();
  return row ? { id: row.user_id } : null;
}
export function accountHeaders(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || !env.ALLOWED_ORIGINS.split(",").includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Methods": "GET, HEAD, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}
async function attempt(env, name, max, windowMs) {
  const now = Date.now(),
    bucket = Math.floor(now / windowMs);
  const row = await env.ACCOUNTS.prepare(
    "INSERT INTO account_attempts (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count",
  )
    .bind(`${name}:${bucket}`, (bucket + 1) * windowMs)
    .first();
  return row.count <= max;
}
export async function accountAuth(request, env) {
  const headers = accountHeaders(request, env);
  if (!headers) return new Response("Origin not allowed", { status: 403 });
  const reply = (data, status = 200) =>
    Response.json(data, { status, headers });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST")
    return reply({ error: "Method not allowed" }, 405);
  if (!env.ACCOUNTS)
    return reply({ error: "Accounts are not configured." }, 503);
  const path = new URL(request.url).pathname;
  try {
    if (path === "/account/logout") {
      const token = (request.headers.get("Authorization") || "").match(
        /^Bearer ([a-f0-9]{64})$/,
      )?.[1];
      if (token)
        await env.ACCOUNTS.prepare(
          "DELETE FROM account_sessions WHERE token_hash = ?",
        )
          .bind(await tokenHash(token))
          .run();
      return reply({ ok: true });
    }
    if (!["/account/register", "/account/login"].includes(path))
      return reply({ error: "Not found" }, 404);
    if (Number(request.headers.get("Content-Length")) > 2048)
      return reply({ error: "Request too large" }, 413);
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Missing account details" }, 400);
    const parts = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 2048) {
        await reader.cancel();
        return reply({ error: "Request too large" }, 413);
      }
      parts.push(value);
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      body.set(part, offset);
      offset += part.length;
    }
    let input;
    try {
      input = JSON.parse(new TextDecoder().decode(body));
    } catch {
      return reply({ error: "Invalid account details" }, 400);
    }
    const username =
      typeof input?.username === "string"
        ? input.username.trim().toLowerCase()
        : "";
    const proof = input?.proof;
    const email =
      input?.email === undefined || input.email === "" ? null : input.email;
    const register = path === "/account/register";
    if (
      !/^[a-z0-9_]{3,24}$/.test(username) ||
      !/^[a-f0-9]{64}$/.test(proof || "")
    )
      return reply(
        { error: "Use a username with 3–24 letters, numbers, or underscores." },
        400,
      );
    if (
      register &&
      email !== null &&
      (typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
      return reply({ error: "Enter a valid email or leave it empty." }, 400);
    const now = Date.now();
    await env.ACCOUNTS.prepare(
      "DELETE FROM account_attempts WHERE expires_at <= ?",
    )
      .bind(now)
      .run();
    const ip = await tokenHash(
      request.headers.get("CF-Connecting-IP") || "local",
    );
    if (
      !(await attempt(
        env,
        `${register ? "register" : "login"}-ip:${ip}`,
        register ? 20 : 60,
        register ? 3600000 : 600000,
      )) ||
      !(await attempt(env, `username:${username}`, 15, 600000))
    )
      return reply(
        { error: "Too many attempts. Wait a few minutes and try again." },
        429,
      );
    let user = await env.ACCOUNTS.prepare(
      "SELECT id, username, salt, verifier FROM accounts WHERE username = ?",
    )
      .bind(username)
      .first();
    if (register) {
      if (user) return reply({ error: "That username is already taken." }, 409);
      const id = crypto.randomUUID(),
        salt = random(16),
        verifier = await makeVerifier(proof, salt);
      const inserted = await env.ACCOUNTS.prepare(
        "INSERT OR IGNORE INTO accounts (id, username, email, salt, verifier, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
        .bind(id, username, email, salt, verifier, now)
        .run();
      if (!inserted.meta.changes)
        return reply({ error: "That username is already taken." }, 409);
      user = { id, username };
    } else {
      const valid = await checkVerifier(
        proof,
        user?.salt || "0".repeat(32),
        user?.verifier || "0".repeat(64),
      );
      if (!user || !valid)
        return reply({ error: "Username or password is incorrect." }, 401);
    }
    await env.ACCOUNTS.prepare(
      "DELETE FROM account_sessions WHERE expires_at <= ?",
    )
      .bind(now)
      .run();
    const token = random(32);
    await env.ACCOUNTS.prepare(
      "INSERT INTO account_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    )
      .bind(await tokenHash(token), user.id, now + 7 * 86400000)
      .run();
    return reply(
      { token, user: { id: user.id, username: user.username } },
      register ? 201 : 200,
    );
  } catch {
    return reply(
      { error: "Account service is temporarily unavailable. Try again." },
      503,
    );
  }
}
