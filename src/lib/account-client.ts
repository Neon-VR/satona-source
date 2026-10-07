import { deriveAuthProof } from "./vault-crypto";
const base = "https://satona-wisp-browser-20261005.satona.workers.dev/account";
let token = "";
export const getAccountToken = () => token;
export async function authenticateAccount(
  username: string,
  password: string,
  create: boolean,
  email = "",
) {
  username = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(username))
    throw new Error(
      "Use 3–24 letters, numbers, or underscores for your username.",
    );
  if (create && password.length < 12)
    throw new Error("Use a password with at least 12 characters.");
  const proof = await deriveAuthProof(password, username);
  const response = await fetch(`${base}/${create ? "register" : "login"}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      proof,
      ...(create && email.trim() ? { email: email.trim() } : {}),
    }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not sign in.");
  token = data.token;
  return data.user as { id: string; username: string };
}
export async function endAccountSession() {
  const previous = token;
  token = "";
  if (previous)
    await fetch(`${base}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${previous}` },
      signal: AbortSignal.timeout(10000),
    }).catch(() => {});
}
