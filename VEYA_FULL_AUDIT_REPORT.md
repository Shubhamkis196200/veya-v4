# VEYa v4 Expo React Native Pre-Launch Audit Report

Date: 2026-05-24 (UTC)
Repository: `/home/ubuntu/projects/veya-v4-app`
Auditor: Codex

## Executive Summary

**Final Verdict: NO-GO for launch**

The app is not launch-ready. There are blocking issues across compilation, backend/schema alignment, security posture, and release configuration.

High-level blockers:

- TypeScript does not compile (`npx tsc --noEmit`): **25 errors**.
- Supabase typing/schema integration is broken (multiple `never` insert/update types, unresolved RPC typing).
- OpenAI API usage is client-side and exposed through `EXPO_PUBLIC_OPENAI_API_KEY` paths.
- Core release config is incomplete for store submission (`ios.bundleIdentifier` and `android.package` missing).
- Production auth/data flows are incomplete (missing sign-in route, onboarding persistence not integrated in app flow).

## What Was Tested

## Automated checks

- `npx tsc --noEmit` -> **failed** (25 errors).
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` -> **failed** (126 errors; includes 101 unused-symbol errors).
- `npx expo export --platform ios --platform android --output-dir /tmp/veya-export` -> **passed** (bundle generated).
- `npx expo config --json` -> resolved config inspected.

## QA/infra checks attempted

- `npm audit --omit=dev` -> **blocked** by DNS/network (`EAI_AGAIN`).
- `npx expo-doctor` -> **blocked** by DNS/network (`EAI_AGAIN`).
- Direct Supabase endpoint probes -> **blocked** (DNS resolution failed from this environment).

## Service QA Matrix

| Service | Status | Findings |
|---|---|---|
| `astroEngine` | FAIL | Type errors in interpretation map typing (`src/services/astroEngine.ts:360`, `:363`, `:366`, `:369`, `:386`). Potential render-thread load in transit calendar/month scan usage. |
| `aiContext` | PARTIAL | Logic is coherent, but depends on failing `astroEngine` type surface. |
| `voiceService` | FAIL | Expo FileSystem API mismatch (`src/services/voiceService.ts:142`, `:144`), client-side OpenAI key usage (`:9`), no temp file cleanup (cache growth risk). |
| `ai.ts` | FAIL | Client-side OpenAI calls (`src/services/ai.ts:29-32`, `:104-112`), edge fallback to direct OpenAI (`:307-327`, `:643-656`), RPC typing broken (`:675`). |
| `rag` | FAIL | Supabase insert typing failures (`src/services/rag.ts:42`, `:113`), error swallowing makes failures silent (`:54-57`, `:127-130`). |
| `streakService` | FAIL | Supabase type failures (`src/services/streakService.ts:64`, `:92`), UTC date logic can mis-handle user-local day boundaries (`:12-23`). |
| `shareService` | FAIL | `ViewShot.capture` typing mismatch (`src/services/shareService.ts:26`) causes compile failure. |

## TypeScript / Broken References Findings

## Critical compile blockers (from `npx tsc --noEmit`)

1. **CRITICAL | Build/Type Safety**
Category: Compilation Blocker  
Evidence: `app/(auth)/onboarding/birth-time.tsx:909`, `src/stores/onboardingStore.ts:5-21`  
Issue: `birthTimeRange` is written in onboarding screen but missing from store type.
Recommended fix: Add `birthTimeRange` to store `OnboardingData` and persist/reset logic.

2. **CRITICAL | Build/Type Safety**
Category: Compilation Blocker  
Evidence: `src/services/voiceService.ts:142`, `:144`  
Issue: `expo-file-system` API usage does not match installed SDK types (`cacheDirectory`, `EncodingType` accessors fail).
Recommended fix: Update to current Expo FileSystem API usage for SDK 54 and retest voice path end-to-end.

3. **CRITICAL | Build/Type Safety**
Category: Compilation Blocker  
Evidence: `src/services/shareService.ts:26`  
Issue: `ViewShot.capture` is called with options while type expects zero args.
Recommended fix: Update to compatible `react-native-view-shot` API signature used by installed version.

4. **CRITICAL | Build/Type Safety**
Category: Compilation Blocker  
Evidence: `src/services/dailyReading.ts:78`, `src/services/onboarding.ts:53`, `src/services/rag.ts:42`, `src/services/streakService.ts:64`  
Issue: Supabase `insert/upsert/update` calls resolve to `never` due malformed DB typing contract.
Recommended fix: Regenerate `Database` types from Supabase (`supabase gen types typescript ...`) and include required schema shape (`Relationships`, `Views`, `Enums`, `CompositeTypes`).

5. **HIGH | Build/Type Safety**
Category: Compilation Blocker  
Evidence: `app/(tabs)/rituals.tsx:615`, `:692`, `:693`, plus constant definitions `:191`, `:199`  
Issue: Ritual status literals are fixed to `'ready'`, making `'complete'`/`'locked'` comparisons unreachable.
Recommended fix: Define a proper union status type and assign runtime values (not hardcoded `as const 'ready'`).

6. **HIGH | Build/Type Safety**
Category: Compilation Blocker  
Evidence: `app/(tabs)/profile.tsx:285`, `:645`  
Issue: `MyChartSummary` expects `birthDate: string | null`, but store passes `string | Date | null`.
Recommended fix: Normalize onboarding `birthDate` type once (store-level) and pass canonical string type to UI.

7. **MEDIUM | Build Hygiene**
Category: Maintainability Risk  
Evidence: strict compile run shows **101 TS6133** unused locals/params.
Recommended fix: enforce linting (`eslint`) and remove dead imports/symbols before release.

## Security Findings

1. **CRITICAL | Security**
Category: Secret Exposure / API Abuse Risk  
Evidence: `src/services/ai.ts:29-32`, `src/services/voiceService.ts:9-10`  
Issue: OpenAI key is consumed as `EXPO_PUBLIC_OPENAI_API_KEY` and used directly from client fetch calls.
Impact: Key extraction from app bundle/traffic is feasible; unbounded abuse and billing risk.
Recommended fix: Remove client-direct OpenAI calls. Route all AI/TTS/STT through secure server/edge functions only.

2. **HIGH | Security**
Category: Key Handling Policy  
Evidence: `src/lib/supabase.ts:7`  
Issue: Supabase anon key hardcoded fallback in source.
Recommended fix: Remove fallback literal and require env injection in build pipeline.

3. **HIGH | Security**
Category: Repo Hygiene  
Evidence: `.gitignore:33-35`, no `.env.example` present  
Issue: `.env` itself is not ignored; only `.env*.local` patterns are ignored.
Recommended fix: Add `.env` and `.env.*` (except `.env.example`) patterns; create `.env.example` template.

4. **LOW | Security/Information Disclosure**
Category: Production Error Surface  
Evidence: `app/_layout.tsx:43-49`  
Issue: Error boundary renders stack trace text in UI.
Recommended fix: Hide stack traces in production builds; log to telemetry instead.

## Runtime Crash / Reliability Risks

1. **CRITICAL | Runtime Flow**
Category: Broken Navigation Reference  
Evidence: `app/(auth)/welcome.tsx:440`; route file `app/(auth)/sign-in.tsx` missing  
Issue: Sign-in CTA points to a non-existent route.
Recommended fix: Implement sign-in screen or remove link until route exists.

2. **HIGH | Runtime/Data Integrity**
Category: Invalid User Identity Format  
Evidence: `app/(tabs)/index.tsx:61`, `app/(tabs)/chat.tsx:138`, `src/components/voice/VoiceInterface.tsx:253`, `SUPABASE_AUDIT.md:66-89`  
Issue: Demo/local user IDs are not UUIDs while backend expects UUID.
Recommended fix: Use authenticated Supabase user UUIDs everywhere; remove placeholder IDs from production flow.

3. **HIGH | Runtime/Data Integrity**
Category: Timezone Conversion Bug  
Evidence: `src/services/onboarding.ts:37-47`  
Issue: `Date -> toISOString()` conversion shifts local birth date/time to UTC.
Impact: Incorrect birth chart calculations.
Recommended fix: Store date and time as local calendar/time strings (not UTC-converted ISO fragments).

4. **MEDIUM | Runtime/Voice UX**
Category: Duplicate TTS Invocation  
Evidence: `src/components/voice/VoicePortal.tsx:43-47` and `src/components/voice/VoiceInterface.tsx:121-137`  
Issue: External responses can be spoken in both portal and interface paths.
Recommended fix: centralize speech responsibility in one component.

5. **MEDIUM | Runtime/Storage**
Category: Cache Growth / Leak Risk  
Evidence: `src/services/voiceService.ts:142-149`, `:159`  
Issue: TTS temp MP3 files are written but never deleted.
Recommended fix: delete temp files after playback or reuse a bounded cache file strategy.

6. **MEDIUM | Runtime/State Logic**
Category: Data Caching Bug  
Evidence: `src/stores/readingStore.ts:182`  
Issue: uses `reading?.date`, but `DailyReading` uses `reading_date`; cache key can remain null.
Recommended fix: set `lastFetchDate` from `reading?.reading_date`.

## Supabase Schema vs TypeScript Types

Reference used: `SUPABASE_AUDIT.md` (dated **2026-02-14 UTC**).

## Mismatch summary

| Table | SUPABASE_AUDIT.md | TS/Service expectation | Risk |
|---|---|---|---|
| `user_profiles` | minimal fields; `name` missing noted | expects `display_name`, `birth_time_precision`, `birth_time_range`, `focus_areas`, `interests`, etc. (`src/types/index.ts`, `src/services/onboarding.ts`) | Writes likely fail or partially persist |
| `birth_charts` | minimal (`id,user_id,chart_data,created_at`) | expects many explicit planet/sign columns (`src/types/index.ts`) | Type drift, read/write ambiguity |
| `daily_readings` | minimal columns | service writes many extended fields (`src/services/dailyReading.ts:59-73`) | insert/upsert failures likely |
| `ai_conversations` | `messages` column mismatch noted | service writes row-per-message (`role`, `content`, `model`) (`src/services/rag.ts:92-109`) | integration contract mismatch |
| `rituals` | `completed_at` and `data` missing noted | TS model expects `title`, `steps`, `completed_today`, `last_completed_at` | backend contract unclear/inconsistent |
| `streaks` | basic streak fields | service expects `streak_type` and `total_check_ins` (`src/services/streakService.ts`) | check-in updates may fail |
| `user_embeddings` | `content`, `embedding`, `metadata` listed | service also writes `content_type` (`src/services/rag.ts:46`) | insert failures possible |

## RPC / Edge Function integration

- As documented in `SUPABASE_AUDIT.md`, edge functions (`generate-reading`, `chat`, `generate-embedding`) were healthy on **2026-02-14**.
- App-side integration exists in `src/services/ai.ts`.
- RPC `match_user_embeddings` had historical parameter mismatch in audit doc.
- Live verification from this workspace was blocked by DNS resolution, so current remote status could not be revalidated today (**2026-05-24**).

## Missing Features / Type-Defined But Not Implemented

1. **HIGH | Feature Completeness**
Category: Unused Core Service  
Evidence: `src/services/onboarding.ts` has no app usage references in current routes.
Issue: onboarding data persistence path to Supabase is defined but not wired into active flow.
Recommended fix: call `saveOnboardingData` on onboarding completion and handle success/error UX.

2. **MEDIUM | Feature Completeness**
Category: Unused Service  
Evidence: `src/services/widgetService.ts` unused.
Issue: widget pathway exists but is not integrated.
Recommended fix: either wire widget updates after reading generation or remove dead service until ready.

3. **MEDIUM | Feature Completeness**
Category: Type/API Drift  
Evidence: multiple exported API request/response interfaces in `src/types/index.ts` have zero usage (`CalculateChartRequest`, `GeneratePersonalityRequest`, etc.).
Recommended fix: remove dead contracts or implement corresponding API flows.

4. **LOW | Repo Hygiene**
Category: Junk/Backup Artifact  
Evidence: `app/(auth)/welcome.tsx.bak`
Recommended fix: remove backup file before release.

## Performance Findings

1. **MEDIUM | Performance**
Category: Heavy compute on UI path  
Evidence: `app/(tabs)/explore.tsx:966` (`getMonthEvents(year, month)`), plus moon/week calculations.
Issue: astronomy calculations for calendar/month events are synchronous and may cause jank on lower-end devices.
Recommended fix: memoize aggressively by month, precompute off-main-thread where possible, cache results in store.

2. **LOW | Performance/Resource**
Category: Timer cleanup  
Evidence: `src/services/ai.ts:93-97`  
Issue: timeout used for abort signal isn’t cleared after fetch completion.
Recommended fix: retain timeout handle and clear on completion to avoid timer accumulation.

## Build Readiness Checklist

| Item | Status | Notes |
|---|---|---|
| TypeScript compile clean | FAIL | 25 errors block release confidence |
| Expo bundle export | PASS | `expo export` succeeded |
| iOS bundle identifier configured | FAIL | `app.json` has no `expo.ios.bundleIdentifier` |
| Android package configured | FAIL | `app.json` has no `expo.android.package` |
| Icons/splash present | PASS | icon/adaptive/splash all present (1024x1024) |
| Dependency vulnerability scan | BLOCKED | `npm audit` blocked by DNS |
| Expo doctor health check | BLOCKED | `expo-doctor` blocked by DNS |

## Store Submission Readiness (App Store / Play)

Required before submission:

1. Add `ios.bundleIdentifier` and `android.package` in `app.json`.
2. Add production `buildNumber` (iOS) and `versionCode` (Android) strategy.
3. Configure permission purpose strings for microphone/notifications in app config.
4. Remove client-side OpenAI key usage; move all AI requests server-side.
5. Implement/restore auth route (`/(auth)/sign-in`) and real user identity flow.
6. Resolve all TS compile blockers and rerun clean checks.
7. Validate Supabase schema migrations against app types and regenerate DB types.
8. Provide privacy policy + data use disclosures aligned with AI/voice processing.
9. Add automated test coverage for critical paths (onboarding, daily reading, chat, voice, streaks).

## Final GO/NO-GO Decision

**NO-GO**

Launch should be blocked until all CRITICAL findings are resolved, and HIGH findings tied to security/auth/schema are closed. After fixes, rerun:

- `npx tsc --noEmit`
- `npx expo export --platform ios --platform android`
- Live Supabase integration checks (tables, RPC, edge functions)
- App startup + onboarding + chat/voice + streak + sharing smoke tests on real devices
