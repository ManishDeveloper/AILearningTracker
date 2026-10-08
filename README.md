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

The app uses Supabase Auth and the `user_progress` table for accounts and personal progress. Writes to `user_progress` must be restricted to `auth.uid() = user_id`. Run [`supabase-group-profiles.sql`](supabase-group-profiles.sql) to let authenticated users read completed-topic IDs for read-only group profiles.

Run [`supabase-leaderboard.sql`](supabase-leaderboard.sql), [`supabase-topic-resources.sql`](supabase-topic-resources.sql), and [`supabase-user-projects.sql`](supabase-user-projects.sql) in the Supabase SQL Editor. Topic resources and user projects are shared with authenticated users; owners can edit or delete only their own entries.
Run [`supabase-leaderboard.sql`](supabase-leaderboard.sql), [`supabase-topic-resources.sql`](supabase-topic-resources.sql), [`supabase-user-projects.sql`](supabase-user-projects.sql), [`supabase-points.sql`](supabase-points.sql), and [`supabase-group-profiles.sql`](supabase-group-profiles.sql) in this order in the Supabase SQL Editor. The group-profile policy exposes completed-topic IDs to signed-in learners; personal account data and write access remain restricted. Topic resources and user projects are shared with authenticated users; owners can edit or delete only their own entries. The points script installs scoring triggers and backfills existing activity totals.

Points are awarded as follows: completing a topic adds 10, adding a resource adds 20, and adding a project adds 100. Unchecking a topic or deleting a resource/project reverses those points; editing a resource or project does not award points again.

If the topic resources table already exists, run the updated [`supabase-topic-resources.sql`](supabase-topic-resources.sql) again to add/backfill author names and enable owner-only edit/delete policies. The script is safe to rerun.

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key. `.env.local` is ignored by Git. Add the same variables in Vercel under **Settings > Environment Variables**, then redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Configure the Supabase Auth Site URL and redirect URL to the deployed Vercel origin. With email confirmation enabled, users must confirm their email before logging in. The old browser-local progress is not automatically migrated.
