# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Supabase setup

The app uses Supabase Auth and the `user_progress` table for accounts and personal progress. The `user_progress` table must have row-level security policies that restrict reads and writes to `auth.uid() = user_id`.

Run [`supabase-leaderboard.sql`](supabase-leaderboard.sql) and [`supabase-topic-resources.sql`](supabase-topic-resources.sql) in the Supabase SQL Editor. The second script creates the shared topic resource table: authenticated users can read all topic links and add links under their own user ID.

If the topic resources table already exists, run the updated [`supabase-topic-resources.sql`](supabase-topic-resources.sql) again to add and backfill the resource author's display name. The script is safe to rerun.

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key. `.env.local` is ignored by Git. Add the same variables in Vercel under **Settings > Environment Variables**, then redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Configure the Supabase Auth Site URL and redirect URL to the deployed Vercel origin. With email confirmation enabled, users must confirm their email before logging in. The old browser-local progress is not automatically migrated.
