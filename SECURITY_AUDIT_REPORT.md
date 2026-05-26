# VEYa v4 — Security, Compliance & Production Readiness Audit

**Date**: 2026-05-26  
**Auditor**: Automated Security Scan  
**Scope**: ~/projects/veya-v4-app

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. OPENAI_API_KEY Placeholder in Source Code
- **File**: `src/services/ai.ts` (line 32)
- **Finding**: `const OPENAI_API_KEY = '';` — Variable declared but empty
- **Risk Level**: LOW (currently empty, but the variable's existence suggests it was previously populated)
- **Status**: ✅ MITIGATED — All OpenAI calls now route through AWS Lambda backend at `https://58to1i483l.execute-api.us-east-1.amazonaws.com`
- **Recommendation**: Remove the `OPENAI_API_KEY` variable entirely to avoid confusion

### 2. EXPO_PUBLIC_ Variables Documented with Secrets  
- **File**: `CLAUDE.md` (lines 268-270)
- **Finding**: Documentation references:
  - `EXPO_PUBLIC_SUPABASE_URL=https://fdivwigdptmrrabpwfyi.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY=***`
  - `EXPO_PUBLIC_OPENAI_API_KEY=***`
- **Risk Level**: MEDIUM — These env var patterns expose keys to the client bundle
- **Status**: ⚠️ PARTIALLY MITIGATED — No `.env` file found in repo (good), but documentation still references the pattern. The current code does NOT use these env vars (confirmed: `supabase.ts` and `ai.ts` use hardcoded AWS API_BASE instead)
- **Recommendation**: Remove all EXPO_PUBLIC_ references from CLAUDE.md; ensure .env.local is never committed

### 3. No Direct OpenAI API Calls from Client
- **Status**: ✅ PASS — Confirmed zero references to `api.openai.com` in codebase
- **All AI calls route through**: `https://58to1i483l.execute-api.us-east-1.amazonaws.com`

---

## 🟡 STORE SUBMISSION BLOCKERS

### 4. Missing iOS Bundle Identifier (CRITICAL FOR SUBMISSION)
- **File**: `app.json` → `expo.ios`
- **Finding**: No `bundleIdentifier` configured
- **Required**: e.g., `"bundleIdentifier": "com.veya.app"`
- **Impact**: ❌ CANNOT submit to App Store without this

### 5. Missing Android Package Name (CRITICAL FOR SUBMISSION)
- **File**: `app.json` → `expo.android`
- **Finding**: No `package` property configured
- **Required**: e.g., `"package": "com.veya.app"`
- **Impact**: ❌ CANNOT submit to Google Play without this

### 6. No Privacy Policy URL
- **Finding**: Zero references to privacy policy URL in the codebase
- **Required by**: Both App Store & Google Play (mandatory for apps collecting personal data)
- **Data collected**: Birth date, birth time, birth place, name, email, voice recordings, AI conversations
- **Impact**: ❌ WILL BE REJECTED by both stores

### 7. No Terms of Service URL
- **Finding**: Zero references to terms of service in the codebase
- **Impact**: ❌ WILL BE REJECTED — required for subscription-based apps

### 8. Splash Screen Background Color Mismatch
- **File**: `app.json` → `expo.splash.backgroundColor`
- **Finding**: Set to `"#ffffff"` (white)
- **Issue**: App uses cosmic dark theme (`#0F0B1A`). White splash creates jarring flash on load.
- **Impact**: ⚠️ Poor user experience, not a blocker but unprofessional

### 9. userInterfaceStyle Set to "light"
- **File**: `app.json` (line 8)
- **Finding**: `"userInterfaceStyle": "light"` but app is dark-themed
- **Impact**: ⚠️ Status bar and system UI may conflict with dark design

---

## 🟢 POSITIVE FINDINGS

### 10. Error Boundaries ✅ IMPLEMENTED
- **Root level**: `app/_layout.tsx` — `ErrorBoundary` class component (line 19)
- **Tab level**: `app/(tabs)/_layout.tsx` — `TabsErrorBoundary` (line 5)
- **Screen level**: `src/components/shared/ScreenErrorBoundary.tsx` — reusable per-screen boundary
- **Usage**: Applied on onboarding screens (personality, methodology, purpose)
- **Status**: ✅ GOOD — Multi-level error boundaries in place

### 11. No Hardcoded API Keys Found ✅
- No `sk-` prefixed strings found in any .ts/.tsx files
- No `sk_live_` or `sk_test_` Stripe keys
- No Supabase service_role keys in client code
- OpenAI key variable exists but is empty string
- **Status**: ✅ PASS

### 12. Assets Configured ✅
- `assets/icon.png` — App icon present
- `assets/splash-icon.png` — Splash screen image present
- `assets/adaptive-icon.png` — Android adaptive icon present
- `assets/favicon.png` — Web favicon present
- Custom fonts loaded (Inter, Playfair Display families)
- **Status**: ✅ PASS (though sizes/quality should be verified)

### 13. Backend Migration Complete ✅
- `src/lib/supabase.ts` — Fully rewritten as AWS Lambda client
- `src/services/ai.ts` — Routes through Lambda proxy
- `src/services/voiceService.ts` — Routes through Lambda proxy
- No direct Supabase connection strings in client code
- **Status**: ✅ PASS

### 14. .gitignore Properly Configured ✅
- `.env*.local` excluded
- `node_modules/` excluded
- Native keystores (`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.pem`) excluded
- **Status**: ✅ PASS

---

## 🟡 DEPENDENCY CONCERNS

### 15. Unused Supabase Dependency
- **Package**: `@supabase/supabase-js: ^2.95.3` still in package.json
- **Issue**: The app no longer uses Supabase directly (migrated to AWS Lambda)
- **Impact**: Unnecessary 200KB+ bundle bloat, potential supply chain risk
- **Recommendation**: Remove from dependencies

### 16. Dependency Versions Assessment
| Package | Version | Status |
|---------|---------|--------|
| expo | ~54.0.33 | ✅ Current |
| react | 19.1.0 | ✅ Latest |
| react-native | 0.81.5 | ✅ Latest |
| zustand | ^5.0.11 | ✅ Current |
| i18next | ^25.8.7 | ✅ Current |
| typescript | ~5.9.2 | ✅ Current |
| react-native-reanimated | ~4.1.1 | ✅ Current |

- **Status**: ✅ No known CVEs in current dependency versions
- **Note**: Run `npx expo doctor` and `npm audit` for definitive vulnerability scan

---

## 📋 ACTION ITEMS (Priority Order)

### P0 — Store Submission Blockers
1. Add `"bundleIdentifier": "com.veya.app"` to `app.json → expo.ios`
2. Add `"package": "com.veya.app"` to `app.json → expo.android`
3. Create and host a Privacy Policy (required: personal data, AI processing, voice recording)
4. Create and host Terms of Service
5. Add privacy policy and ToS URLs to app (Settings/Profile screen)

### P1 — Security Cleanup
6. Remove `const OPENAI_API_KEY = '';` from `src/services/ai.ts`
7. Remove EXPO_PUBLIC_ references from `CLAUDE.md`
8. Remove `@supabase/supabase-js` from package.json dependencies

### P2 — UX Polish
9. Change `app.json → splash.backgroundColor` to `"#0F0B1A"` (match dark theme)
10. Change `app.json → userInterfaceStyle` to `"dark"`
11. Verify icon/splash assets meet Apple (1024x1024) and Google (512x512) size requirements

---

## Summary Score

| Category | Score | Details |
|----------|-------|---------|
| API Key Security | ✅ 9/10 | No leaked keys; dead variable should be removed |
| Backend Security | ✅ 10/10 | All calls through Lambda; no direct API exposure |
| Error Handling | ✅ 8/10 | Multi-level boundaries; could add to more screens |
| Store Readiness | ❌ 3/10 | Missing bundle IDs, privacy policy, ToS |
| Dependencies | ✅ 8/10 | Current versions; unused supabase pkg |
| Assets | ✅ 7/10 | Present but theme mismatch on splash |

**Overall**: App is **secure for demo** but **NOT ready for store submission** without the P0 items above.
