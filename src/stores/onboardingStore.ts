import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingData {
  name: string;
  birthDate: Date | string | null;
  birthTime: Date | string | null;
  birthTimeKnown: boolean;
  birthTimePrecision: string;
  birthTimeRange?: 'morning' | 'afternoon' | 'evening' | 'night';
  birthPlace: string;
  birthLat: number | null;
  birthLng: number | null;
  timezone: string | null;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  methodology: string[];
  purpose: string[];
  focusAreas: string[];
}

interface OnboardingStore {
  currentStep: number;
  data: OnboardingData;
  onboardingCompleted: boolean;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (updates: Partial<OnboardingData>) => void;
  completeOnboarding: () => void;
  setOnboardingCompleted: (completed: boolean) => void;
  resetOnboarding: () => void;
}

const initialData: OnboardingData = {
  name: '',
  birthDate: null,
  birthTime: null,
  birthTimeKnown: false,
  birthTimePrecision: 'unknown',
  birthPlace: '',
  birthLat: null,
  birthLng: null,
  timezone: null,
  methodology: ['western'],
  purpose: [],
  focusAreas: [],
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      data: initialData,
      onboardingCompleted: false,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
      updateData: (updates) => set((s) => ({ data: { ...s.data, ...updates } })),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      resetOnboarding: () => set({ currentStep: 0, data: initialData, onboardingCompleted: false }),
    }),
    { name: 'veya-onboarding', storage: createJSONStorage(() => AsyncStorage) }
  )
);
