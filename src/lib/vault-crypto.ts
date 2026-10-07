export type EncryptedVault = { version: 1; iv: string; ciphertext: string };
const utf8 = new TextEncoder();
function base64(bytes: Uint8Array) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192)
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
function unbase64(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
export async function deriveVaultKey(password: string, userId: string) {
  const material = await crypto.subtle.importKey(
    "raw",
    utf8.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: utf8.encode(`satona-vault-v1:${userId}`),
      iterations: 600000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptVault(
  value: unknown,
  key: CryptoKey,
  userId: string,
): Promise<EncryptedVault> {
  const plain = utf8.encode(JSON.stringify(value));
  if (plain.length > 1_000_000)
    throw new Error(
      "Your backup is larger than 1 MB. Reduce saved data or turn off website sessions.",
    );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: utf8.encode(userId) },
    key,
    plain,
  );
  return {
    version: 1,
    iv: base64(iv),
    ciphertext: base64(new Uint8Array(encrypted)),
  };
}
export async function decryptVault(
  vault: EncryptedVault,
  key: CryptoKey,
  userId: string,
): Promise<unknown> {
  if (vault.version !== 1 || vault.ciphertext.length > 1_400_000)
    throw new Error("Unsupported backup.");
  try {
    const data = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: unbase64(vault.iv),
        additionalData: utf8.encode(userId),
      },
      key,
      unbase64(vault.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(data));
  } catch {
    throw new Error(
      "This password cannot unlock your backup. Use the password that created it.",
    );
  }
}
