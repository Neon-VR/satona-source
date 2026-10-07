import test from "node:test";
import assert from "node:assert/strict";
import {
  accountAuth,
  makeVerifier,
  checkVerifier,
  tokenHash,
} from "../src/account-auth.js";
import { accountSync } from "../src/account-sync.js";
import { setup, request } from "./helpers/d1.js";
const proof = "a".repeat(64);
const vault = {
  version: 1,
  iv: "abcdefghijklmnop",
  ciphertext: "abcdefghijklmnopqrstuvwx",
};
async function register(env, username) {
  const r = await accountAuth(
    request("register", "POST", { username, proof }),
    env,
  );
  assert.equal(r.status, 201);
  return r.json();
}
test("username-only registration, login and logout use salted verifiers and hashed expiring sessions", async () => {
  const { env, db } = setup();
  const a = await register(env, "test_user");
  const row = db.prepare("SELECT * FROM accounts").get();
  assert.equal(row.email, null);
  assert.notEqual(row.verifier, proof);
  assert.equal(
    db.prepare("SELECT * FROM account_sessions").get().token_hash,
    await tokenHash(a.token),
  );
  let r = await accountAuth(
    request("login", "POST", { username: "TEST_USER", proof }),
    env,
  );
  assert.equal(r.status, 200);
  assert.equal((await r.json()).user.id, a.user.id);
  assert.equal(
    (
      await accountAuth(
        request("login", "POST", {
          username: "test_user",
          proof: "b".repeat(64),
        }),
        env,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await accountAuth(
        request("register", "POST", { username: "TEST_USER", proof }),
        env,
      )
    ).status,
    409,
  );
  assert.equal(
    (await accountSync(request("sync", "GET", undefined, a.token), env)).status,
    200,
  );
  await accountAuth(request("logout", "POST", undefined, a.token), env);
  assert.equal(
    (await accountSync(request("sync", "GET", undefined, a.token), env)).status,
    401,
  );
  const b = await register(env, "second_user");
  db.prepare("UPDATE account_sessions SET expires_at = 0").run();
  assert.equal(
    (await accountSync(request("sync", "GET", undefined, b.token), env)).status,
    401,
  );
  db.close();
});
test("encrypted backups isolate users and reject stale writes, plaintext, and oversized bodies", async () => {
  const { env, db } = setup();
  const a = await register(env, "first_user"),
    b = await register(env, "other_user");
  const put = (body) => accountSync(request("sync", "PUT", body, a.token), env);
  assert.equal(
    (await put({ vault, revision: 0, user_id: b.user.id })).status,
    200,
  );
  assert.equal(
    (
      await (
        await accountSync(request("sync", "GET", undefined, b.token), env)
      ).json()
    ).vault,
    null,
  );
  assert.deepEqual(
    (
      await (
        await accountSync(request("sync", "GET", undefined, a.token), env)
      ).json()
    ).vault,
    vault,
  );
  assert.equal((await put({ vault, revision: 0 })).status, 409);
  assert.equal((await put({ vault, revision: 1 })).status, 200);
  assert.equal((await put({ vault, revision: 1 })).status, 409);
  assert.equal(
    (await put({ vault: { cookies: "secret" }, revision: 2 })).status,
    400,
  );
  assert.equal(
    (
      await put({
        vault: { ...vault, ciphertext: "a".repeat(1500001) },
        revision: 2,
      })
    ).status,
    413,
  );
  assert.equal((await put(null)).status, 400);
  db.close();
});
test("auth validates optional email, origin, invalid sessions and rate limits repeated guesses", async () => {
  const { env, db } = setup();
  assert.equal(
    (
      await accountAuth(
        request("register", "POST", {
          username: "valid_name",
          proof,
          email: "bad-email",
        }),
        env,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await accountAuth(
        request(
          "register",
          "POST",
          { username: "valid_name", proof },
          undefined,
          "https://evil.example",
        ),
        env,
      )
    ).status,
    403,
  );
  const a = await register(env, "limited_user");
  const email = await accountAuth(
    request("register", "POST", {
      username: "email_user",
      proof,
      email: "fixture@example.invalid",
    }),
    env,
  );
  assert.equal(email.status, 201);
  assert.equal(
    db.prepare("SELECT email FROM accounts WHERE username='email_user'").get()
      .email,
    "fixture@example.invalid",
  );
  assert.equal(
    (await accountSync(request("sync", "GET", undefined, "invalid"), env))
      .status,
    401,
  );
  for (let i = 0; i < 14; i++)
    assert.equal(
      (
        await accountAuth(
          request("login", "POST", {
            username: "limited_user",
            proof: "b".repeat(64),
          }),
          env,
        )
      ).status,
      401,
    );
  assert.equal(
    (
      await accountAuth(
        request("login", "POST", { username: "limited_user", proof }),
        env,
      )
    ).status,
    429,
  );
  assert.equal(
    (await accountSync(request("sync", "GET", undefined, a.token), env)).status,
    200,
  );
  db.close();
});
test("password verifiers reject incorrect proofs and use independent random salts", async () => {
  const first = await makeVerifier(proof, "1".repeat(32));
  assert.notEqual(first, await makeVerifier(proof, "2".repeat(32)));
  assert.equal(await checkVerifier(proof, "1".repeat(32), first), true);
  assert.equal(
    await checkVerifier("b".repeat(64), "1".repeat(32), first),
    false,
  );
});
