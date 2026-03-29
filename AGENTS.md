---
description: Code Pals project context for AI assistants
globs: "*"
alwaysApply: true
---

# Code Pals

- **Stack**: Vite, React 18, React Router, Tailwind CSS **3.4** (do not upgrade Tailwind to v4).
- **Backend**: **Supabase** (PostgreSQL, Auth, Row Level Security). Use `@/integrations/supabase/client` for all app data and **`supabase.functions.invoke`** for Edge Functions (e.g. `run-code`).
- **Code execution**: Edge Function `supabase/functions/run-code` calls **Piston** using shared config in `supabase/functions/_shared/run-code-piston.ts`. The React client uses `src/lib/runCode.js` (`executeUserCode`). Successful responses are `{ stdout, stderr, exitCode }`. Set secrets **`PISTON_API_BASE`**, optionally **`PISTON_RUN_MEMORY_BYTES`**, **`PISTON_RUN_TIMEOUT_MS`**, **`PISTON_COMPILE_TIMEOUT_MS`**. The public Piston demo may be allowlist-only; self-host when needed.
- **Language routing**: `src/lib/codeRunnerLanguage.js` maps curriculum slugs to editor + API language keys (must stay aligned with `LANGUAGE_ALIASES` in the shared Piston module).

Do not add InsForge or other duplicate BaaS clients; Supabase is the single backend integration for this repo.
