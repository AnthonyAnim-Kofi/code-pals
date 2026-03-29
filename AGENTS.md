---
description: Code Pals project context for AI assistants
globs: "*"
alwaysApply: true
---

# Code Pals

- **Stack**: Vite, React 18, React Router, Tailwind CSS **3.4** (do not upgrade Tailwind to v4).
- **Backend**: **Supabase** (PostgreSQL, Auth, Row Level Security). Use `@/integrations/supabase/client` for all app data and **`supabase.functions.invoke`** for Edge Functions (e.g. `run-code`).
- **Code execution**: The `run-code` Edge Function (`supabase/functions/run-code`) proxies to **Piston**. For production, set **`PISTON_API_BASE`** (and optionally **`PISTON_RUN_MEMORY_BYTES`**) as secrets on the function. The public Piston demo host may be allowlist-only; self-host Piston when needed.
- **Language routing**: Curriculum slugs are resolved in `src/lib/codeRunnerLanguage.js` for the editor and sandbox API key.

Do not add InsForge or other duplicate BaaS clients; Supabase is the single backend integration for this repo.
