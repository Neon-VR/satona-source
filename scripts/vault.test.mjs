import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveVaultKey,
  encryptVault,
  decryptVault,
} from "../src/lib/vault-crypto.ts";
test("encrypted browser data round trips on another device with the same password", async () => {
  const data = {
    cookies: '{"session":"private"}',
    preferences: { bookmark: "https://example.com" },
  };
  const first = await deriveVaultKey("a-long-test-password", "user-1");
  const other = await deriveVaultKey("a-long-test-password", "user-1");
  const vault = await encryptVault(data, first, "user-1");
  assert.deepEqual(await decryptVault(vault, other, "user-1"), data);
  assert.ok(!JSON.stringify(vault).includes("private"));
  assert.notEqual((await encryptVault(data, first, "user-1")).iv, vault.iv);
  await assert.rejects(decryptVault(vault, first, "user-2"));
  const wrong = await deriveVaultKey("a-different-password", "user-1");
  await assert.rejects(decryptVault(vault, wrong, "user-1"));
  await assert.rejects(
    decryptVault(
      {
        ...vault,
        ciphertext:
          (vault.ciphertext[0] === "A" ? "B" : "A") + vault.ciphertext.slice(1),
      },
      first,
      "user-1",
    ),
  );
  await assert.rejects(
    encryptVault("x".repeat(1_000_001), first, "user-1"),
    /larger than/,
  );
});
