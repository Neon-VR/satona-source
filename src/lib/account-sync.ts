import {
  authenticateAccount,
  endAccountSession,
  getAccountToken,
} from "./account-client";
import {
  deriveVaultKey,
  encryptVault,
  decryptVault,
  type EncryptedVault,
} from "./vault-crypto";
import { ensureController } from "../proxy/scramjet";

const endpoint =
  "https://satona-wisp-browser-20261005.satona.workers.dev/account/sync";
export const preferenceKeys = [
  "satona.bookmarks",
  "satona.history",
  "satona.identity",
  "satona.galaxy-accent",
  "satona.motion",
  "satona.searchEngine",
  "satona.game-favorites",
  "satona.favorite-games",
  "satona.recent-games",
  "satona.video-history",
  "satona.note",
  "satona.os.installed",
];
const isWebsiteKey = (key: string) =>
  /^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?@/i.test(key);
type Snapshot = {
  version: 1;
  preferences: Record<string, string>;
  cookies?: string;
  webStorage?: Record<string, string>;
};
type State = {
  username: string;
  status: string;
  busy: boolean;
  unlocked: boolean;
  includeSessions: boolean;
  lastSync: string;
  conflict: boolean;
  available: boolean;
};
let state: State = {
  username: "",
  status: "Sign in to take your Satona data with you.",
  busy: false,
  unlocked: false,
  includeSessions: true,
  lastSync: "",
  conflict: false,
  available: false,
};
const listeners = new Set<() => void>();
export const subscribeAccount = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getAccountState = () => state;
function update(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}
let key: CryptoKey | null = null,
  userId = "",
  revision = 0,
  lastSnapshot = "",
  timer: ReturnType<typeof setInterval> | undefined;
export async function checkAccountService() {
  if (state.unlocked || state.busy) return;
  try {
    const result = await fetch(endpoint, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!result.ok) throw new Error();
    update({
      available: true,
      status: "Sign in to take your Satona data with you.",
    });
  } catch {
    update({
      available: false,
      status:
        "Cloud accounts are not available yet. Your data is still saved on this device.",
    });
  }
}
async function api(method: "GET" | "PUT", body?: unknown) {
  const token = getAccountToken();
  if (!token) throw new Error("Sign in again to sync your account.");
  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const result = (await response.json()) as {
    error?: string;
    conflict?: boolean;
    revision: number;
    updatedAt?: string;
    vault: EncryptedVault | null;
  };
  if (!response.ok) {
    if (result.conflict) update({ conflict: true });
    throw new Error(result.error || "Could not connect to account sync.");
  }
  return result;
}
async function capture(): Promise<Snapshot> {
  const preferences: Record<string, string> = {};
  for (const name of preferenceKeys) {
    const value = localStorage.getItem(name);
    if (value !== null) preferences[name] = value;
  }
  const result: Snapshot = { version: 1, preferences };
  if (state.includeSessions) {
    result.cookies = (await ensureController()).cookieJar.dump();
    result.webStorage = {};
    for (const name of Object.keys(localStorage))
      if (isWebsiteKey(name))
        result.webStorage[name] = localStorage.getItem(name)!;
  }
  return result;
}
function validate(data: unknown): Snapshot {
  const value = data as Snapshot;
  const stringRecord = (v: unknown) =>
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.values(v).every((x) => typeof x === "string");
  if (
    value?.version !== 1 ||
    !stringRecord(value.preferences) ||
    (value.webStorage !== undefined && !stringRecord(value.webStorage))
  )
    throw new Error("Invalid account backup.");
  if (value.cookies !== undefined) {
    const cookies = JSON.parse(value.cookies);
    if (
      !cookies ||
      typeof cookies !== "object" ||
      Array.isArray(cookies) ||
      Object.values(cookies).some(
        (c) =>
          !c ||
          typeof c !== "object" ||
          typeof (c as { name?: unknown }).name !== "string" ||
          typeof (c as { value?: unknown }).value !== "string",
      )
    )
      throw new Error("Invalid saved website sessions.");
  }
  return value;
}
async function apply(snapshot: Snapshot) {
  const controller = await ensureController();
  // Only our explicit preference list and Scramjet's host@key namespace are restored.
  const before = new Map<string, string | null>();
  const entries = [
    ...preferenceKeys.map(
      (name) => [name, snapshot.preferences[name] ?? null] as const,
    ),
    ...(state.includeSessions
      ? [
          ...new Set([
            ...Object.keys(localStorage).filter(isWebsiteKey),
            ...Object.keys(snapshot.webStorage || {}).filter(isWebsiteKey),
          ]),
        ].map((name) => [name, snapshot.webStorage?.[name] ?? null] as const)
      : []),
  ];
  const oldCookies = controller.cookieJar.dump();
  try {
    for (const [name, value] of entries) {
      before.set(name, localStorage.getItem(name));
      if (value === null) localStorage.removeItem(name);
      else localStorage.setItem(name, value);
    }
    if (state.includeSessions) {
      controller.cookieJar.clear();
      controller.cookieJar.load(snapshot.cookies || "{}");
      await controller.persistCookies();
    }
  } catch (error) {
    for (const [name, value] of before) {
      if (value === null) localStorage.removeItem(name);
      else localStorage.setItem(name, value);
    }
    controller.cookieJar.clear();
    controller.cookieJar.load(oldCookies);
    await controller.persistCookies();
    throw error;
  }
  window.dispatchEvent(new Event("satona-preferences"));
  window.dispatchEvent(new Event("satona-account-restored"));
}
export async function saveAccount(force = false) {
  if (!key || !state.unlocked || state.busy || state.conflict) return;
  update({ busy: true });
  try {
    const snapshot = await capture(),
      serialized = JSON.stringify(snapshot);
    if (!force && serialized === lastSnapshot) return;
    const vault = await encryptVault(snapshot, key, userId);
    const result = await api("PUT", { vault, revision });
    revision = result.revision;
    lastSnapshot = serialized;
    update({
      lastSync: result.updatedAt || "",
      status: "Your encrypted backup is up to date.",
    });
  } catch (error) {
    update({
      status:
        error instanceof Error ? error.message : "Sync failed. Try again.",
    });
  } finally {
    update({ busy: false });
  }
}
export async function restoreAccount() {
  if (!key || state.busy) return;
  update({ busy: true });
  try {
    const result = await api("GET");
    if (!result.vault)
      throw new Error("No cloud backup exists yet. Save this device first.");
    await apply(validate(await decryptVault(result.vault, key, userId)));
    revision = result.revision;
    lastSnapshot = JSON.stringify(await capture());
    update({
      conflict: false,
      lastSync: result.updatedAt || "",
      status:
        "Restored your cloud backup. Open your browser again to use saved sessions.",
    });
  } catch (error) {
    update({
      status: error instanceof Error ? error.message : "Restore failed.",
    });
  } finally {
    update({ busy: false });
  }
}
export async function signIntoAccount(
  username: string,
  password: string,
  includeSessions: boolean,
  create = false,
  email = "",
) {
  if (!state.available) return;
  if (state.busy) return;
  update({
    busy: true,
    status: create
      ? "Creating your account…"
      : "Opening your encrypted backup…",
  });
  try {
    const nextUser = await authenticateAccount(
      username,
      password,
      create,
      email,
    );
    const nextKey = await deriveVaultKey(password, nextUser.id);
    const backup = await api("GET");
    update({ includeSessions });
    if (backup.vault)
      await apply(
        validate(await decryptVault(backup.vault, nextKey, nextUser.id)),
      );
    key = nextKey;
    userId = nextUser.id;
    revision = backup.revision;
    lastSnapshot = backup.vault ? JSON.stringify(await capture()) : "";
    update({
      username: nextUser.username,
      unlocked: true,
      conflict: false,
      lastSync: backup.updatedAt || "",
      status: backup.vault
        ? "Your browser data has been restored."
        : "Signed in. Your first encrypted backup will save shortly.",
    });
    clearInterval(timer);
    timer = setInterval(() => void saveAccount(), 30000);
  } catch (error) {
    key = null;
    userId = "";
    await endAccountSession();
    update({
      username: "",
      unlocked: false,
      status: error instanceof Error ? error.message : "Could not sign in.",
    });
  } finally {
    update({ busy: false });
  }
  if (state.unlocked) await saveAccount();
}
export async function signOutAccount() {
  if (state.busy) return;
  update({ busy: true });
  clearInterval(timer);
  key = null;
  try {
    await endAccountSession();
    for (const name of [
      ...preferenceKeys,
      ...Object.keys(localStorage).filter(isWebsiteKey),
    ])
      localStorage.removeItem(name);
    const controller = await ensureController();
    controller.cookieJar.clear();
    await controller.persistCookies();
    userId = "";
    revision = 0;
    lastSnapshot = "";
    update({
      username: "",
      unlocked: false,
      lastSync: "",
      conflict: false,
      status: "Signed out. Synced browser data was cleared from this device.",
    });
    window.dispatchEvent(new Event("satona-preferences"));
    window.dispatchEvent(new Event("satona-account-restored"));
  } catch {
    update({
      username: "",
      unlocked: false,
      status:
        "Signed out. Close Satona tabs to finish clearing active website sessions.",
    });
  } finally {
    update({ busy: false });
  }
}
