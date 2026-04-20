
**Goal**: Make all languages in the playground/lessons work once the user sets up Piston (or an alternative).

**Plan**

1. **Refactor `supabase/functions/code-playground/index.ts`** so when `PISTON_API_BASE` secret is present, ALL non-native languages (Java, C++, Ruby, Go, Rust, C#, Swift, Kotlin, PHP, Dart, etc.) are forwarded to Piston using the shared helpers in `supabase/functions/_shared/run-code-piston.ts` — instead of returning the current 400 "requires external service" error.

2. **Mirror the same logic in `supabase/functions/run-code/index.ts`** so lesson code-runner challenges behave identically to the playground.

3. **Auto-resolve runtime versions**: Call Piston's `/runtimes` endpoint once and cache the latest version per language, so users don't have to specify versions manually.

4. **Improve error messaging**: When `PISTON_API_BASE` is NOT set, return a clearer message in the playground UI pointing to setup docs, instead of a raw 400.

5. **Keep native fast-path**: JavaScript, TypeScript, Python (subset), and HTML/CSS continue to run locally in Deno without hitting Piston — for speed and to work even without Piston configured.

6. **Redeploy** both edge functions.

**Files touched**
- `supabase/functions/code-playground/index.ts`
- `supabase/functions/run-code/index.ts`
- (Possibly) `supabase/functions/_shared/run-code-piston.ts` for a `getLatestVersion()` helper

**What you need to do first**
- Pick option A, B, or C above and get a working Piston URL
- Add `PISTON_API_BASE` secret in Lovable Cloud (e.g. `https://piston.yourdomain.com/api/v2`)
- Then tell me "Piston is ready" and I'll wire it up
