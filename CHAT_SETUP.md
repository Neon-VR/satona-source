# Satona public chat setup

The Chat page uses Supabase Realtime and guest display names. Messages are public to anyone using this chat; display names are not verified accounts.

1. Create a Supabase project.
2. Run [`CHAT_SETUP.sql`](./CHAT_SETUP.sql) in the Supabase SQL Editor.
3. Copy the project URL and its public anon/publishable key into `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
   ```

4. Restart the local Vite server. For the deployed site, add the same two variables to the Vercel project’s environment settings and redeploy.

Use only the public anon/publishable key in the browser. Never put a Supabase service-role key in a `VITE_` variable.
