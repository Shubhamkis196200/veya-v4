# VEYa — AI Astrology App

> "Your AI Astrologer Who Truly Knows You"
> Single source of truth for all AI agents working on this project.

## 1. Project Identity

| Field | Value |
|-------|-------|
| Name | VEYa |
| Repo | `~/repos/veya-v4` |
| GitHub | `Shubhamkis196200/VEYa-AI-Astrology` |
| Type | Mobile App (iOS + Android) |
| Framework | Expo 54 / React Native 0.81 |
| Owner | Shubham Kishore |

## 2. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Expo (React Native) | ~54.0.33 |
| React | React | 19.1.0 |
| Routing | Expo Router | ~6.0.23 |
| State | Zustand | ^5.0.11 |
| Backend | Supabase (Auth + DB + Edge Functions) | ^2.95.3 |
| AI Model | OpenAI GPT-4o | via Edge Functions |
| Embeddings | text-embedding-3-small (1536 dim) | via Edge Functions |
| Astrology | astronomy-engine | ^2.1.19 |
| Voice | Whisper STT + GPT-4o + TTS-1 | via Edge Functions |
| Animations | React Native Reanimated | ~4.1.1 |
| i18n | i18next (18 languages) | ^25.8.7 |
| TypeScript | TypeScript | ~5.9.2 |

## 3. Credentials

All credentials stored in `~/.env.veya` (chmod 600, VEYA_ prefix).

```bash
source ~/.env.veya
```

| Variable | Purpose |
|----------|---------|
| `VEYA_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VEYA_SUPABASE_URL` | Supabase API URL |
| `VEYA_SUPABASE_ANON_KEY` | Client-side anon key |
| `VEYA_SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key |
| `VEYA_SUPABASE_ACCESS_TOKEN` | Management API token |
| `VEYA_OPENAI_API_KEY` | OpenAI API (used in Edge Functions) |
| `VEYA_EXPO_SLUG` | Expo app slug: `veya-v4` |
| `VEYA_EXPO_OWNER` | Expo account: `shubham987654` |
| `VEYA_EAS_PROJECT_ID` | EAS project ID |

**Note**: Supabase project `fdivwigdptmrrabpwfyi` is shared with veya-v3. Edge Functions live in the veya-v3 repo (`~/repos/veya-v3/supabase/functions/`).

## 4. Project Structure

```
veya-v4/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (fonts, providers)
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/                   # Auth flow
│   │   ├── welcome.tsx           # Landing page
│   │   └── onboarding/           # 9-step onboarding
│   │       ├── name.tsx          # Step 1: Name
│   │       ├── birth-date.tsx    # Step 2: Birth date
│   │       ├── birth-time.tsx    # Step 3: Birth time
│   │       ├── birth-place.tsx   # Step 4: Birth place
│   │       ├── chart-reveal.tsx  # Step 5: Chart reveal (wow moment)
│   │       ├── personality.tsx   # Step 6: AI personality reading
│   │       ├── methodology.tsx   # Step 7: System selection
│   │       ├── purpose.tsx       # Step 8: Purpose selection
│   │       └── interests.tsx     # Step 9: Interests -> tabs
│   └── (tabs)/                   # Main app (5 tabs)
│       ├── index.tsx             # Today (daily briefing)
│       ├── chat.tsx              # AI Chat + Voice
│       ├── explore.tsx           # Tarot, Compatibility, Transits
│       ├── rituals.tsx           # Morning/Evening rituals
│       └── profile.tsx           # Settings, Birth chart, Account
│
├── src/
│   ├── components/
│   │   ├── home/                 # Today tab: DailyBriefingCard, DoAndDontCard, EnergyMeter, StreakCounter, TransitHighlights
│   │   ├── shared/               # CompatibilityModal, MoonPhase, NatalChart, ShareableCard, TarotCard, ZodiacIcon
│   │   ├── voice/                # VoiceButton, VoiceInterface, VoicePortal
│   │   ├── onboarding/           # OnboardingLayout, StepIndicator
│   │   └── ui/                   # AnimatedPressable, DesignTokens, GradientCard, SectionHeader
│   │
│   ├── services/                 # 12 business logic services
│   │   ├── ai.ts                 # OpenAI chat completion
│   │   ├── aiContext.ts          # Smart prompt builder (transits + natal + RAG)
│   │   ├── astroEngine.ts        # Real planetary calculations (astronomy-engine)
│   │   ├── dailyReading.ts       # Daily reading logic
│   │   ├── dailyReadingGenerator.ts # Reading generation
│   │   ├── notificationService.ts
│   │   ├── onboarding.ts         # Onboarding flow management
│   │   ├── rag.ts                # RAG memory system
│   │   ├── shareService.ts       # Share card generation
│   │   ├── streakService.ts      # Streak tracking
│   │   ├── voiceService.ts       # Voice AI pipeline (record -> STT -> GPT -> TTS)
│   │   └── widgetService.ts      # Widget data
│   │
│   ├── stores/                   # 7 Zustand stores
│   │   ├── chatStore.ts          # Chat messages + sessions
│   │   ├── journalStore.ts       # Journal entries
│   │   ├── onboardingStore.ts    # Onboarding state
│   │   ├── readingStore.ts       # Daily readings
│   │   ├── streakStore.ts        # Streak data
│   │   ├── userStore.ts          # User profile + auth
│   │   └── voiceStore.ts         # Voice recording state
│   │
│   ├── lib/
│   │   ├── openai.ts             # AI config (model, tokens, temperature)
│   │   └── supabase.ts           # Supabase client
│   │
│   ├── constants/
│   │   ├── veyaPrompt.ts         # Chat system prompt
│   │   └── veyaVoicePrompt.ts    # Voice system prompt
│   │
│   ├── data/
│   │   └── tarotDeck.ts          # 78 tarot cards
│   │
│   ├── theme/
│   │   ├── colors.ts             # Color palette (warm cream light theme)
│   │   ├── typography.ts         # Playfair Display + Inter
│   │   ├── spacing.ts
│   │   ├── borderRadius.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   └── index.ts              # All TypeScript types
│   │
│   └── i18n/
│       ├── index.ts              # i18next setup
│       └── locales/              # 18 language JSON files
│           ├── en.json, es.json, hi.json, pl.json, fr.json, de.json
│           ├── pt.json, it.json, tr.json, ja.json, ko.json, ar.json
│           ├── id.json, nl.json, sv.json, th.json, vi.json, uk.json
│
├── assets/                       # Images, fonts
├── agents/                       # Agent prompt files
├── .env.local                    # Local environment variables
├── app.json                      # Expo config
├── eas.json                      # EAS build config
├── package.json
└── tsconfig.json
```

## 5. Supabase Backend

### Project
- **Ref**: `fdivwigdptmrrabpwfyi`
- **URL**: `https://fdivwigdptmrrabpwfyi.supabase.co`
- **Shared with**: veya-v3 (edge functions deployed from v3 repo)

### Database Tables (8)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_profiles` | User data | user_id, display_name, birth_date/time/place, sun/moon/rising_sign, focus_areas, subscription_tier |
| `birth_charts` | Natal charts | user_id, all planet signs+degrees (sun through pluto + nodes + chiron), house_cusps, aspects |
| `daily_readings` | Daily horoscopes | user_id, reading_date, energy_level, reading_text, do/dont_guidance, transit_highlights |
| `ai_conversations` | Chat history | user_id, session_id, role, content, tokens_used, model |
| `user_embeddings` | RAG memory | user_id, content, content_type, embedding (vector), metadata |
| `rituals` | User rituals | user_id, ritual_type, title, steps, duration_minutes, completed_today |
| `streaks` | Streak tracking | user_id, streak_type, current_streak, longest_streak, last_check_in |
| `subscriptions` | Billing | user_id, plan, status, provider, trial_ends_at, period dates |

### RPC Functions
- `match_user_embeddings(query_embedding, match_user_id, match_count, match_threshold)` — Vector similarity search for RAG memory

### Edge Functions (deployed from veya-v3 repo)

| Function | Purpose | Model |
|----------|---------|-------|
| `chat` | AI chat with VEYa system prompt | GPT-4o |
| `generate-embedding` | Create vector embeddings | text-embedding-3-small |
| `generate-reading` | Daily reading generation (structured JSON) | GPT-4o |

Edge function source: `~/repos/veya-v3/supabase/functions/`

## 6. Key Services

### astroEngine.ts — Real Astronomical Calculations
Uses `astronomy-engine` (pure JS, no API calls) for accurate planetary positions.
- `getCurrentTransits(date)` — All planet positions for any date
- `getMoonPhase(date)` — Phase name, sign, illumination percentage
- `calculateNatalChart(birthData)` — Full birth chart from birth data
- `calculateAspects(transits, natal)` — Transit-to-natal aspects
- `getDailyTransitSummary(date, natal)` — Daily cosmic weather

### aiContext.ts — Smart Prompt Builder
Combines real-time data into personalized AI context:
- Current date/time + planetary transits
- User's natal chart placements
- Moon phase data
- RAG memories from past conversations
- Output: enriched system prompt for GPT-4o

### voiceService.ts — Voice AI Pipeline
Flow: Tap mic -> Record audio -> Whisper STT -> GPT-4o (with smart context) -> TTS-1 playback
Target latency: < 5 seconds end-to-end

### rag.ts — Memory System
Stores conversation insights as vector embeddings, retrieves relevant memories for context injection.

## 7. Design System

### Theme: Warm Cream Light (NOT dark)

```
Background:    #FDFBF7  (Warm Cream)
Surface:       #F5F0E8  (Warm Linen — cards)
Surface Alt:   #EDE7DB  (Warm Sand)
Primary:       #8B5CF6  (Cosmic Purple)
Primary Dark:  #7C3AED
Accent Gold:   #D4A547  (Jewelry tone)
Accent Rose:   #E8788A  (Soft Rose)
Text Primary:  #1A1A2E  (Deep Indigo)
Text Secondary:#6B6B80  (Muted Indigo)
Border:        #E5DFD5  (Warm light gray)
```

### Zodiac Element Colors
- Fire: `#E8664D` (Terracotta) | Earth: `#6B8E6B` (Sage)
- Air: `#D4A547` (Gold) | Water: `#5B8DB8` (Dusty Blue)

### Typography
- **Headers**: Playfair Display (elegant serif)
- **Body**: Inter (clean sans-serif)

### UI Patterns
- Card-based layouts with warm linen backgrounds
- Cosmic gradients (purple accents on cream)
- Subtle glow effects, smooth Reanimated animations
- 5-tab navigation: Today, Chat, Explore, Rituals, Profile

## 8. App Flow

### Onboarding (9 screens)
```
Welcome -> Name -> Birth Date -> Birth Time -> Birth Place
-> Chart Reveal (wow!) -> Personality -> Methodology
-> Purpose -> Interests -> Main App
```

### Main App (5 tabs)
1. **Today** — Daily briefing, energy meter, do/don't guidance, transit highlights, streak
2. **Chat** — AI conversation with voice support, RAG memory context
3. **Explore** — Tarot (78 cards), compatibility engine, transit calendar
4. **Rituals** — Morning/evening rituals, breathing timer, journal
5. **Profile** — Settings, natal chart view, account, subscription

### 5 Moat Features
1. Voice AI Astrologer (0 competitors have this)
2. RAG Memory (AI remembers past conversations)
3. 3D Immersive Design (screenshot-worthy)
4. Multi-System Fusion (Western + Vedic + Chinese)
5. Personal Cosmic Narrative (user's ongoing story)

## 9. i18n — 18 Languages

en, es, hi, pl, fr, de, pt, it, tr, ja, ko, ar, id, nl, sv, th, vi, uk

Device language auto-detected via `expo-localization`.

## 10. Expo / EAS Config

| Field | Value |
|-------|-------|
| Slug | `veya-v4` |
| Owner | `shubham987654` |
| Version | `1.0.0` |
| Runtime Version | `1.0.0` |
| Scheme | `veya` |
| EAS Project ID | `9b22dded-d32f-4d48-af2b-d727d09dfafd` |
| User Interface | Light |

### Commands
```bash
# Development
cd ~/repos/veya-v4 && npm start

# OTA Update
npx eas update --branch preview --message "description"

# Build
npx eas build --platform all --profile preview

# Push
git add . && git commit -m "message" && git push origin master
```

## 11. Known Issues

### Resolved
- Chat AI wrong date — FIXED (aiContext.ts injects real date)
- Real transits — FIXED (astronomy-engine)
- Voice AI race condition — FIXED
- Tarot card system — FIXED (78 cards + reveal)
- Premium unlock — FIXED

### Remaining
- TypeScript errors (non-blocking, Supabase types)
- Supabase schema: user_profiles missing `name`, ai_conversations missing `messages`, rituals missing `completed_at`/`data`
- Transit calendar needs real data integration
- Cosmic patterns feature needs implementation
- Some animations need performance optimization

## 12. AI Configuration

```typescript
// src/lib/openai.ts
AI_CONFIG = {
  model: 'gpt-4o',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  maxTokens: 1024,
  temperature: 0.7,
}
```

All OpenAI calls go through Supabase Edge Functions — NOT direct client calls.
System prompts defined in `src/constants/veyaPrompt.ts` and `veyaVoicePrompt.ts`.

## 13. Core Philosophy

- **Warm, not cold** — opposite of Co-Star's harsh tone
- **Personal, not generic** — uses REAL birth chart + live transits
- **Empowering** — astrology shows patterns, not destiny
- **Beautiful** — warm cream theme, screenshot-worthy UI
