import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
export const origin = "https://satona-study.b-cdn.net";
export function setup() {
  const db = new DatabaseSync(":memory:");
  for (const file of ["0001_accounts.sql", "0002_username_accounts.sql"])
    db.exec(
      readFileSync(
        new URL(`../../migrations/${file}`, import.meta.url),
        "utf8",
      ),
    );
  const env = {
    ALLOWED_ORIGINS: origin,
    ACCOUNTS: {
      prepare(sql) {
        return {
          bind(...args) {
            const stmt = db.prepare(sql);
            return {
              async first() {
                return stmt.get(...args) || null;
              },
              async run() {
                const result = stmt.run(...args);
                return { meta: { changes: Number(result.changes) } };
              },
            };
          },
        };
      },
    },
  };
  return { env, db };
}
export function request(path, method = "GET", body, token, from = origin) {
  return new Request(`https://relay.example/account/${path}`, {
    method,
    headers: {
      Origin: from,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
