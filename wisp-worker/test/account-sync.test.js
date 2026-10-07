import test from "node:test";
import assert from "node:assert/strict";
import { accountSync } from "../src/account-sync.js";
const origin = "https://satona-study.b-cdn.net";
const uid = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
const vault = {
  version: 1,
  iv: "abcdefghijklmnop",
  ciphertext: "abcdefghijklmnopqrstuvwx",
};
function setup() {
  const rows = new Map();
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              return rows.get(args[0]) || null;
            },
            async run() {
              if (sql.startsWith("INSERT")) {
                const [id, payload, date] = args;
                if (rows.has(id)) return { meta: { changes: 0 } };
                rows.set(id, { payload, revision: 1, updated_at: date });
              } else {
                const [payload, date, id, revision] = args;
                const old = rows.get(id);
                if (!old || old.revision !== revision)
                  return { meta: { changes: 0 } };
                rows.set(id, {
                  payload,
                  revision: revision + 1,
                  updated_at: date,
                });
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
  return {
    rows,
    env: {
      ALLOWED_ORIGINS: origin,
      ACCOUNTS: db,
      SUPABASE_URL: "https://auth.example",
      SUPABASE_ANON_KEY: "public",
    },
  };
}
function req(method = "GET", body, token = "a".repeat(30), from = origin) {
  return new Request("https://relay.example/account/sync", {
    method,
    headers: {
      Origin: from,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
const auth =
  (id = uid) =>
  async () =>
    Response.json({ id, email_confirmed_at: "2026-10-07" });
test("backup access requires an allowed origin and server-verified confirmed user", async () => {
  const { env } = setup();
  let calls = 0;
  const noCall = async () => {
    calls++;
    throw Error();
  };
  assert.equal(
    (
      await accountSync(
        req("GET", undefined, undefined, "https://evil.example"),
        env,
        noCall,
      )
    ).status,
    403,
  );
  assert.equal(
    (await accountSync(req("GET", undefined, "bad"), env, noCall)).status,
    401,
  );
  assert.equal(calls, 0);
  assert.equal(
    (
      await accountSync(
        req(),
        env,
        async () => new Response("", { status: 401 }),
      )
    ).status,
    401,
  );
  assert.equal(
    (await accountSync(req(), env, async () => Response.json({ id: uid })))
      .status,
    403,
  );
});
test("encrypted backups are isolated by authenticated user and reject stale device writes", async () => {
  const { env, rows } = setup();
  assert.equal(
    (
      await accountSync(
        req("PUT", { vault, revision: 0, user_id: other }),
        env,
        auth(),
      )
    ).status,
    200,
  );
  assert.ok(rows.has(uid));
  assert.ok(!rows.has(other));
  assert.equal(
    (await (await accountSync(req(), env, auth(other))).json()).vault,
    null,
  );
  assert.deepEqual(
    (await (await accountSync(req(), env, auth())).json()).vault,
    vault,
  );
  assert.equal(
    (await accountSync(req("PUT", { vault, revision: 0 }), env, auth())).status,
    409,
  );
  assert.equal(
    (await accountSync(req("PUT", { vault, revision: 1 }), env, auth())).status,
    200,
  );
  assert.equal(
    (await accountSync(req("PUT", { vault, revision: 1 }), env, auth())).status,
    409,
  );
});
test("plaintext and oversized backups are rejected", async () => {
  const { env } = setup();
  assert.equal(
    (
      await accountSync(
        req("PUT", { vault: { cookies: "secret" }, revision: 0 }),
        env,
        auth(),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await accountSync(
        req("PUT", {
          vault: { ...vault, ciphertext: "a".repeat(1_500_001) },
          revision: 0,
        }),
        env,
        auth(),
      )
    ).status,
    413,
  );
});
