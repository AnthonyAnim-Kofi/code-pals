# CodeBear Site Documentation (User Side)

## 1) Overview

CodeBear is a gamified coding-learning web app built with React + Vite and powered by Supabase (Auth, Postgres, RLS, realtime, Edge Functions).  
This document covers the complete **user-facing** site behavior and technical design, and **excludes admin-side features**.

### Core user goals
- Learn programming through structured lessons.
- Practice completed lessons without risk.
- Earn XP, gems, achievements, and maintain streaks.
- Compete in weekly leagues and leaderboards.
- Socialize by following users and sending lesson challenges.
- Track progress and customize profile/settings.

## 2) Tech Stack and Architecture

### Frontend
- React 18 + React Router.
- Tailwind CSS 3.4 + custom UI components (shadcn-style primitives).
- TanStack Query for server-state caching and invalidation.
- Joyride for product tour.
- Monaco/CodeMirror integrations for code-runner editing.

### Backend
- Supabase Auth for authentication.
- Supabase Postgres for all user/content/gameplay data.
- Supabase Row Level Security for per-user data access rules.
- Supabase Edge Function `run-code` for code execution.
- Edge function integrates with Piston API through shared runtime config.

### Runtime model
- SPA routes with protected app section.
- Main app layout includes sidebar/mobile nav, right-rail progress widgets, notifications, and onboarding prompts.
- Most user actions write directly to Supabase tables through hooks, then invalidate related query keys.

## 3) Route Map (User Side)

## Public routes
- `/` - Landing/marketing page.
- `/login` - Email/password login.
- `/signup` - Signup with optional referral code and coding experience.
- `/onboarding` - 4-step initial setup flow after signup.

## Protected routes
- `/learn` - Main learning roadmap by language and units.
- `/lesson/:lessonId` - Full lesson experience (normal/practice/challenge modes).
- `/leaderboard` - Weekly league and all-time rankings.
- `/quests` - Daily/weekly quests and rewards.
- `/shop` - Gem-powered power-ups and premium promo.
- `/profile` - User stats, streak, study analytics, referral entry.
- `/referral` - Referral share/history/reward totals.
- `/settings` - Profile/avatar/theme/alert toggles.
- `/social` - Following/followers/discover/challenges.
- `/achievements` - Achievement tracking and unlocks.
- `/practice` - Replay completed lessons safely.
- `/languages` - Language selection and progress previews.
- `/league-history` - Promotion/demotion history.

## Other
- `*` - Not found page.

> Admin routes exist in the app but are intentionally excluded from this document.

## 4) Authentication and Session

- Uses Supabase email/password auth.
- Session persists in browser local storage.
- Auth context exposes `signIn`, `signUp`, `signOut`, `user`, and loading state.
- Protected routes require authenticated session before rendering the main app.
- Signup supports optional metadata (`coding_experience`) used for progression behavior.

## 5) New User Flow

1. User signs up with email/password.
2. Optional referral code is validated before account continuation.
3. User enters onboarding:
   - Step 1: display name + avatar.
   - Step 2: language selection.
   - Step 3: daily goal minutes.
   - Step 4: confirmation summary.
4. On finish:
   - profile is updated (`display_name`, `username`, `avatar_url`, `active_language_id`, `daily_goal_minutes`, `onboarding_completed`).
   - optional referral reward RPC is applied.
   - user navigates to learn route scoped to selected language.

## 6) Navigation and Layout

### Desktop
- Left sidebar:
  - Learn, Leaderboard, Quests, Shop, Profile.
  - Languages, Social, Referrals, Achievements, Practice, League History, Settings.
  - Logout action.
- Right sidebar (`UserProgress`):
  - streak, XP, hearts, gems, daily goal progress, heart timer, league timer.

### Mobile
- Top fixed header:
  - avatar shortcut, streak/gems/hearts quick stats.
- Bottom fixed nav:
  - Learn, Ranks, Quests, Shop, plus “More” sheet.
- “More” sheet contains non-core routes + logout.

## 7) Learning Experience

## Learn page (`/learn`)
- Language-aware roadmap with URL sync (`?language=`).
- Displays units and lessons in a zig-zag path.
- Completion state controls lock/unlock for lessons and units.
- Language preference is persisted to profile.
- Seasonal banners are displayed based on theme/holiday state.
- Intermediate/advanced users can jump start point (advanced-start unit behavior).

## Lesson page (`/lesson/:lessonId`)
- Question types:
  - fill-blank,
  - multiple-choice,
  - drag-order,
  - code-runner.
- Tracks:
  - current question,
  - answer correctness,
  - XP earned,
  - hearts,
  - answered question indices,
  - mascot feedback state.
- Partial progress autosaves to resume in-progress lessons.
- Completion flow:
  - marks lesson complete (first-time completion only for progression rewards),
  - awards XP,
  - updates quest progress,
  - clears partial progress.

### Lesson modes
- Default mode:
  - hearts can be deducted on wrong answers,
  - normal XP/progress rewards apply.
- Practice mode (`?mode=practice`):
  - no heart deduction,
  - no progression-impact XP/quest effects.
- Challenge mode (`?mode=challenge&challengeId=...`):
  - no heart deduction,
  - score is submitted to challenge record.

## Practice page (`/practice`)
- Lists only completed lessons.
- Groups lessons by language.
- Launches lessons in practice mode for concept review.

## 8) Code Runner System

### Frontend behavior
- Code-runner questions execute through `executeUserCode`.
- Supports many language slugs via `resolveCodeRunnerLanguage`.
- Distinguishes:
  - runnable languages in sandbox,
  - markup preview use-cases,
  - unsupported runtime languages.

### Backend execution path
- Client calls Supabase Edge Function `run-code`.
- Function validates request body and code-size limit.
- Function resolves runtime language alias to Piston runtime.
- If version unspecified, function probes Piston runtimes.
- Executes code via Piston `execute` endpoint.
- Returns normalized payload:
  - `stdout`,
  - `stderr`,
  - `exitCode`.

### Important operational secrets
- `PISTON_API_BASE` (required in restricted environments).
- `PISTON_RUN_MEMORY_BYTES` (optional).
- `PISTON_RUN_TIMEOUT_MS` (optional).
- `PISTON_COMPILE_TIMEOUT_MS` (optional).

## 9) Gamification Systems

## XP and progression
- XP is added per correct answers and lesson completion logic.
- Profile tracks:
  - total XP,
  - weekly XP,
  - daily XP (with daily reset behavior).

## Hearts
- Wrong answers in normal mode deduct hearts.
- If hearts drop below max, heart-regeneration timer starts.
- Shop supports heart refill purchase.

## Gems
- Earned via quests and referral rewards.
- Spent in shop for power-ups.

## Streaks
- Profile stores streak counters and metadata.
- Streak visuals appear in profile, popovers, and desktop progress panel.
- Streak freeze tokens can be purchased and consumed to preserve streak behavior.

## Quests (`/quests`)
- Daily + weekly quests.
- Progress rows initialized per date/week.
- Supports dynamic target resolution (e.g., daily XP goal relation to profile goal).
- Claim per-quest or claim-all rewards.
- Reward claim updates profile gems.

## Achievements (`/achievements`)
- Achievement catalog from DB (`achievements`).
- Earned list from `user_achievements`.
- Global monitor computes stats and auto-awards newly met milestones.
- Categories include:
  - learning,
  - streaks,
  - XP/leagues,
  - social.
- Unlocks trigger in-app notifications.

## Leagues and leaderboard (`/leaderboard`)
- Weekly and all-time views.
- Weekly view:
  - league-scoped ranking by `weekly_xp`,
  - promotion/demotion thresholds,
  - week reset countdown,
  - optional weekly chest reward previews.
- All-time view:
  - global ranking by total XP.
- Realtime updates from profile table changes.

## League history (`/league-history`)
- Shows promoted/demoted transitions over prior week cycles.
- Includes from/to leagues, week ending date, rank, and weekly XP snapshot.

## 10) Social System

## Following/Followers
- User follow graph managed via `user_follows`.
- Discover tab lists users except current user.
- Supports follow/unfollow and mutual detection.

## Challenges
- Users challenge others on a chosen lesson.
- Challenge states:
  - pending,
  - completed (after both scores).
- Incoming challenges can be accepted or declined.
- Completing challenge-mode lessons writes score to challenger/challenged fields.
- Result UI supports win/loss/tie outcomes.

## 11) Profile, Referral, and Settings

## Profile (`/profile`)
- Displays:
  - avatar/display name/email,
  - streak/weekly XP/total XP/league/join date,
  - streak freeze indicator,
  - streak calendar,
  - study stats section.
- Includes logout and settings shortcuts.

## Referral (`/referral`)
- Displays personal referral code/link.
- Supports native share (if available) and clipboard copy.
- Shows referred users and gems awarded history.
- Tracks total gems earned from referrals.

## Settings (`/settings`)
- Tabs:
  - Profile (display name),
  - Avatar selection by category,
  - Alerts toggles (currently UI-level state).
- Includes seasonal theme override control.
- Save action persists profile fields via update mutation.

## Languages (`/languages`)
- Visual language picker.
- Shows active language and lightweight per-language progress signals.
- Switching updates `active_language_id` in profile.

## 12) Notifications and User Guidance

## In-app notification manager
- Handles challenge alerts for newly received pending challenges.
- Handles challenge result notifications (win/loss/tie).
- Enables streak reminder behavior.

## Product tour
- One-time guided walkthrough via Joyride.
- Separate desktop and mobile step sets.
- Completion/skip persists `tour_completed`.

## Device notifications (native builds)
- Capacitor local notifications integration.
- Schedules holiday/event alerts + daily reminder.
- Runs only on native platform contexts.

## 13) Data Model (User-Relevant)

The user-side features primarily rely on these public tables/RPCs:

- `profiles` - user core stats and preferences.
- `languages`, `units`, `lessons`, `questions`, `unit_notes` - curriculum.
- `lesson_progress` - completion and performance records.
- `partial_lesson_progress` - resumable in-progress lesson state.
- `daily_quests`, `user_quest_progress` - quest definitions and user state.
- `shop_items` - purchasable items shown in shop.
- `achievements`, `user_achievements` - badge system.
- `user_follows` - social graph.
- `challenges` - social challenge state/scores.
- `league_history`, league threshold/chest config tables - league progression metadata.
- `study_sessions` - profile analytics.
- `referrals` - referral attribution/reward history.

Common user-side RPC usage:
- `validate_referral_code`
- `apply_referral_reward`
- `process_weekly_leagues` (trigger hook exists)

## 14) Security and Access Patterns

- App expects Supabase RLS to enforce user-specific reads/writes.
- Protected routing prevents unauthenticated access to main app pages.
- Most mutations use current authenticated user ID and invalidate relevant query keys.
- Edge function validates input payload shape and size before execution.

## 15) Performance and UX Notes

- Query caching via TanStack Query across profile/progress/social data.
- Targeted invalidations after mutations keep UI consistent.
- Loading states are implemented for all major pages.
- Realtime leaderboard updates via Supabase channel subscription.
- Autosave and resume for lessons reduce loss of progress.

## 16) Environment and Operations

### Required frontend env
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Code runner env (Edge Function)
- `PISTON_API_BASE` strongly recommended in production.
- Optional memory and timeout controls documented in section 8.

### Typical local commands
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test`

## 17) Feature Boundaries (What is excluded here)

This documentation intentionally excludes:
- admin authentication and admin routes,
- admin content management UIs,
- admin bulk import and admin operational tooling.

Everything else described is user-facing behavior in the main learner experience.

