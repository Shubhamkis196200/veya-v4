// ============================================================================
// VEYa Reading Store — Zustand + AsyncStorage persistence
// ============================================================================
// Supports both offline-first generated readings and Supabase-cached AI readings.
// The generated reading is always available instantly; AI reading is optional upgrade.
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateDailyReadingForSign,
  getTodayReadingForSign,
} from '../services/dailyReadingGenerator';
import type { GeneratedDailyReading } from '../services/dailyReadingGenerator';
import type { DailyReading, UserProfile, ZodiacSign } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadingStore {
  // Offline-first generated reading (always available)
  generatedReading: GeneratedDailyReading | null;
  generatedReadingDate: string | null;

  // Optional Supabase-backed AI reading
  todayReading: DailyReading | null;
  lastFetchDate: string | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions — Generated (offline-first)
  loadGeneratedReading: (zodiacSign: ZodiacSign, date?: string) => GeneratedDailyReading;
  getOrLoadReading: (zodiacSign: ZodiacSign) => GeneratedDailyReading;
  ensureGeneratedReading: (zodiacSign: ZodiacSign) => Promise<GeneratedDailyReading>;

  // Actions — AI-powered (optional, requires network)
  fetchTodayReading: (userProfile: UserProfile) => Promise<DailyReading | null>;
  setTodayReading: (reading: DailyReading | null) => void;

  // Actions — Common
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearReading: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useReadingStore = create<ReadingStore>()(
  persist(
    (set, get) => ({
      generatedReading: null,
      generatedReadingDate: null,
      todayReading: null,
      lastFetchDate: null,
      isLoading: false,
      error: null,

      // ----- Offline-first: instant generated reading -----

      loadGeneratedReading: (zodiacSign: ZodiacSign, date?: string) => {
        const targetDate = date || getTodayDate();
        const { generatedReading, generatedReadingDate } = get();

        // Return cached if same date and sign
        if (
          generatedReading &&
          generatedReadingDate === targetDate &&
          generatedReading.zodiacSign === zodiacSign
        ) {
          return generatedReading;
        }

        // Generate fresh reading (deterministic, zero latency)
        const reading = generateDailyReadingForSign(zodiacSign, targetDate);

        set({
          generatedReading: reading,
          generatedReadingDate: targetDate,
          error: null,
        });

        return reading;
      },

      getOrLoadReading: (zodiacSign: ZodiacSign) => {
        const today = getTodayDate();
        const { generatedReading, generatedReadingDate } = get();

        if (
          generatedReading &&
          generatedReadingDate === today &&
          generatedReading.zodiacSign === zodiacSign
        ) {
          return generatedReading;
        }

        return get().loadGeneratedReading(zodiacSign, today);
      },

      ensureGeneratedReading: async (zodiacSign: ZodiacSign) => {
        set({ isLoading: true, error: null });
        try {
          return get().getOrLoadReading(zodiacSign);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to generate reading';
          set({ error: errorMessage });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // ----- Network: AI-powered reading (optional enhancement) -----

      fetchTodayReading: async (userProfile) => {
        const today = getTodayDate();
        const { lastFetchDate, todayReading } = get();

        // Return cached if already fetched today
        if (lastFetchDate === today && todayReading) {
          return todayReading;
        }

        set({ isLoading: true, error: null });

        try {
          // Dynamic import to avoid bundling Supabase in the critical path
          const { getTodayReading, generateAndCacheDailyReading, fetchUserChart } =
            await import('../services/dailyReading');

          // 1. Check Supabase cache
          let reading = await getTodayReading(userProfile.user_id);

          if (reading) {
            set({
              todayReading: reading,
              isLoading: false,
              lastFetchDate: today,
            });
            return reading;
          }

          // 2. Generate via AI
          const chart = await fetchUserChart(userProfile.user_id);
          reading = await generateAndCacheDailyReading(userProfile, chart);

          set({
            todayReading: reading,
            isLoading: false,
            lastFetchDate: today,
          });

          return reading;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to fetch reading';
          console.error('[ReadingStore] fetchTodayReading error:', errorMessage);
          set({ isLoading: false, error: errorMessage });
          return null;
        }
      },

      setTodayReading: (reading) =>
        set({
          todayReading: reading,
          error: null,
          lastFetchDate: reading?.reading_date || null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isLoading: false }),

      clearReading: () =>
        set({
          generatedReading: null,
          generatedReadingDate: null,
          todayReading: null,
          error: null,
          lastFetchDate: null,
        }),
    }),
    {
      name: 'veya-reading-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        generatedReading: state.generatedReading,
        generatedReadingDate: state.generatedReadingDate,
        todayReading: state.todayReading,
        lastFetchDate: state.lastFetchDate,
      }),
    },
  ),
);
