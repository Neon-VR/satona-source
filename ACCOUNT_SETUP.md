# Satona accounts

The frontend contains a Satona Account app, also available in Settings. It stays
unavailable until the Worker reports that the cloud backend is configured.

## Provisioning a new deployment

1. Refresh Cloudflare authorization with `npx wrangler login`.
2. In `wisp-worker`, run `npx wrangler d1 create satona-accounts`.
3. Add the returned database ID in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "ACCOUNTS"
database_name = "satona-accounts"
database_id = "<returned ID>"
migrations_dir = "migrations"
```

4. Run `npx wrangler d1 migrations apply satona-accounts --remote` to apply both migrations.
5. Deploy with `npx wrangler deploy`, then test username registration, sign-in,
   save/restore on a second device, conflict handling, and sign-out.

No Supabase credentials are needed by the account API.

## Data and limits

Backups contain selected Satona preferences, bookmarks/history, game favorites,
recent games, and optionally Scramjet cookies and its namespaced localStorage.
They do not copy the host browser's Google/other accounts. Device-bound sessions,
passkeys, IndexedDB, files, and game saves are not transferred. Sites can require
sign-in again even when their cookies are restored.

AES-256-GCM encrypts the backup before upload. PBKDF2-SHA256 with 600,000 iterations
and a user-specific salt derives the key from the account password. Keys and
account sessions remain in memory. Each D1 record belongs to the server-verified,
authenticated Satona user; optimistic revisions reject stale device writes.
Backups have a 1 MB plaintext limit. Password changes cannot decrypt the old backup.

Sign-in restores the cloud snapshot over the synced fields on the current device.
Restoring closes open apps. Auto-save runs every 30 seconds while unlocked; use
Save now before closing a tab. Two devices do not merge changes automatically:
a conflict pauses writes until the user restores the current cloud version.
Sign-out clears synced preferences and website cookies/storage on that device.


## Current deployment

The account database is provisioned and the username auth API is deployed. Email
is optional and only collected during registration. It is not used for sign-in or
password recovery. Sign-in uses a case-insensitive 3–24 character username and a
password. Chat still uses its separate existing Supabase configuration.

Login credentials use a domain-separated 600,000-iteration PBKDF2-SHA256 proof
computed by the client. The Worker applies a random salt and 100,000 additional
PBKDF2 iterations, storing an HMAC verifier. This is separate from the vault key.
Session tokens contain 256 random bits; only their SHA-256 hashes are stored in
D1. They expire after seven days, remain in browser memory, and are revoked on
sign-out. Per-IP and per-username request counters throttle registration/login.

GN-Math documents now run at the Worker origin through `/game`, with an explicit
Satona frame-ancestors policy; they no longer receive the parent origin through
srcdoc. LuminSDK game URLs remain on their provider origin. Synced proxy sessions
still depend on Scramjet compatibility, and websites may demand authentication.

Validation: 35 local automated checks pass, including real SQLite migrations,
username auth, optional email, rate limiting, session expiry/revocation, encrypted
backup isolation, conflict handling, and cryptographic round trips. The live
service readiness check passes. On October 7, 2026, the user-approved live test
also passed: username registration/login without email, wrong-password rejection,
encrypted backup restoration in a second independent session, cross-account
isolation, stale-write rejection, and logout revocation. The two synthetic test
accounts and their sessions/backups were removed after testing. This test does
not establish Google/NVIDIA session compatibility on a second physical device.

On October 7, 2026, the user confirmed that sign-in works across devices.
The exact third-party sites tested were not specified; individual sites can still
require a new login when their security checks or device-bound credentials apply.
