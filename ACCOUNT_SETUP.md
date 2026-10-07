# Satona accounts

The frontend contains a Satona Account app, also available in Settings. It stays
unavailable until the Worker reports that the cloud backend is configured.

## Provisioning

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

4. Run `npx wrangler d1 migrations apply satona-accounts --remote`.
5. Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the same project used by
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Use Wrangler secrets; never
   use a Supabase service-role key in the frontend or commit credentials.
6. Enable email/password authentication and email confirmation in Supabase.
7. Deploy with `npx wrangler deploy`, then test sign-up, confirmed sign-in,
   save, restore on a second device, conflict handling, and sign-out.

## Data and limits

Backups contain selected Satona preferences, bookmarks/history, game favorites,
recent games, and optionally Scramjet cookies and its namespaced localStorage.
They do not copy the host browser's Google/other accounts. Device-bound sessions,
passkeys, IndexedDB, files, and game saves are not transferred. Sites can require
sign-in again even when their cookies are restored.

AES-256-GCM encrypts the backup before upload. PBKDF2-SHA256 with 600,000 iterations
and a user-specific salt derives the key from the account password. Keys and
Supabase sessions remain in memory. Each D1 record belongs to the server-verified,
confirmed Supabase user; optimistic revisions reject stale device writes.
Backups have a 1 MB plaintext limit. Password changes cannot decrypt the old backup.

Sign-in restores the cloud snapshot over the synced fields on the current device.
Restoring closes open apps. Auto-save runs every 30 seconds while unlocked; use
Save now before closing a tab. Two devices do not merge changes automatically:
a conflict pauses writes until the user restores the current cloud version.
Sign-out clears synced preferences and website cookies/storage on that device.

Browser proxy content and game providers are third-party code. Before enabling
accounts for production, validate their origin isolation from account UI and
restore flows, and exercise the real two-device flow. Unit tests cover encryption
and API authorization, but do not establish compatibility with Google/NVIDIA.
