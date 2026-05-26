/**
 * VEYa — Rituals Tab: Your Daily Practice 🌙
 * Morning & evening rituals, cosmic journal, streak tracking, AI insights.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
// Haptics loaded dynamically (Expo Go safe)
async function hapticImpact(style: 'Light' | 'Medium' = 'Light') {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(
      style === 'Light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
  } catch {}
}
import AnimatedPressable from '@/components/ui/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMoonPhase, getCurrentTransits } from '@/services/astroEngine';
import { colors as themeColors } from '@/theme/colors';
import { useJournalStore } from '@/stores/journalStore';
import { generateJournalInsights } from '@/services/ai';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const colors = {
  background: '#FDFBF7',
  surface: '#F5F0E8',
  surfaceAlt: '#EDE7DB',
  white: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9B9BAD',
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#EDE9FE',
  accentGold: '#D4A547',
  accentGoldLight: '#FDF4E3',
  sunriseOrange: '#F4A261',
  streakFlame: '#FF6B35',
  streakFlameBg: 'rgba(255, 107, 53, 0.08)',
  doGreen: '#4A9D6E',
  doGreenBg: '#F0F9F4',
  journalCream: '#FFF8F0',
  premiumGold: '#C9A84C',
  cardBorder: 'rgba(212, 165, 71, 0.12)',
  cardShadow: 'rgba(139, 92, 246, 0.08)',
} as const;

const typography = {
  fonts: {
    display: 'PlayfairDisplay-Bold',
    displaySemiBold: 'PlayfairDisplay-SemiBold',
    displayItalic: 'PlayfairDisplay-Italic',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
  },
  sizes: {
    display2: 28,
    heading3: 18,
    body: 16,
    bodySmall: 14,
    caption: 13,
    tiny: 11,
  },
} as const;

const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = spacing.lg;

// AnimatedPressable imported from @/components/ui/AnimatedPressable

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

function getRealRitualContent() {
  try {
    const moon = getMoonPhase();
    const transits = getCurrentTransits();
    const retrogrades = transits.filter(p => p.retrograde);

    const moonIntentions: Record<string, string> = {
      'New Moon': `New Moon in ${moon.moonSign} — set a powerful intention for this fresh cycle`,
      'Waxing Crescent': `Waxing Moon in ${moon.moonSign} — nurture the seeds you've planted`,
      'First Quarter': `First Quarter in ${moon.moonSign} — take action on your intentions`,
      'Waxing Gibbous': `Waxing Gibbous in ${moon.moonSign} — refine and adjust your approach`,
      'Full Moon': `Full Moon in ${moon.moonSign} — illuminate what needs to be released`,
      'Waning Gibbous': `Waning Gibbous in ${moon.moonSign} — share your wisdom with others`,
      'Last Quarter': `Last Quarter in ${moon.moonSign} — reflect and forgive`,
      'Waning Crescent': `Waning Crescent in ${moon.moonSign} — rest and restore before the new cycle`,
    };
    const intention = moonIntentions[moon.phaseName] || `Moon in ${moon.moonSign} — align with cosmic energy`;

    const moonAffirmations: Record<string, string> = {
      Aries: '"I trust my courage to lead me where I need to go."',
      Taurus: '"I am grounded, abundant, and worthy of comfort."',
      Gemini: '"I embrace curiosity and let my mind explore freely."',
      Cancer: '"I honor my emotions as my greatest compass."',
      Leo: '"I shine my light boldly and inspire those around me."',
      Virgo: '"I find beauty in the details and trust the process."',
      Libra: '"I attract harmony and create beauty wherever I go."',
      Scorpio: '"I transform through honesty and welcome deep truth."',
      Sagittarius: '"I expand my horizons and trust the adventure ahead."',
      Capricorn: '"I build with patience and my discipline serves my dreams."',
      Aquarius: '"I honor my uniqueness and contribute to something greater."',
      Pisces: '"I trust my intuition to guide me toward beauty and truth."',
    };
    const affirmation = moonAffirmations[moon.moonSign] || '"I trust the cosmos to guide my path."';

    const retroStr = retrogrades.length > 0
      ? `${retrogrades.map(r => r.name).join(' & ')} retrograde`
      : 'No retrogrades — clear forward energy';
    const energyForecast = `${moon.emoji} ${moon.phaseName} energy. ${retroStr}`;

    const mercurySign = transits.find(p => p.name === 'Mercury')?.sign || 'Pisces';
    const sunSign = transits.find(p => p.name === 'Sun')?.sign || 'Aquarius';
    const journalPrompt = `Mercury in ${mercurySign}, Sun in ${sunSign} — what truth is asking to be spoken?`;

    return { intention, affirmation, energyForecast, journalPrompt };
  } catch {
    return {
      intention: 'Set an intention aligned with your cosmic energy',
      affirmation: '"I trust the cosmos to guide my path."',
      energyForecast: 'Tune into your energy today',
      journalPrompt: 'What is the universe trying to tell you right now?',
    };
  }
}

const REAL_RITUAL = getRealRitualContent();

const MOCK = {
  userName: 'Aria',
  streakCount: 7,
  streakDays: [true, true, true, true, true, true, false],
  dayLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],

  morningRitual: {
    status: 'ready' as 'ready' | 'complete' | 'locked',
    intention: REAL_RITUAL.intention,
    affirmation: REAL_RITUAL.affirmation,
    energyForecast: REAL_RITUAL.energyForecast,
    estimatedTime: '~2 min',
  },

  eveningRitual: {
    status: 'ready' as 'ready' | 'complete' | 'locked',
    availableAt: '7:00 PM',
    reflectionPrompt: 'What moment today made you feel most alive?',
    estimatedTime: '~2 min',
  },

  journal: {
    todaysPrompt: REAL_RITUAL.journalPrompt,
    recentEntries: [
      { id: '1', date: 'Feb 12', preview: 'Felt a deep pull toward journaling today. The Pisces energy is...', mood: '✨' },
      { id: '2', date: 'Feb 11', preview: 'Had the most intense dream about water and old friends...', mood: '🌊' },
      { id: '3', date: 'Feb 9', preview: 'Mars square Saturn hit hard. Frustrated at work but...', mood: '🔥' },
    ],
  },

  insights: [
    'You feel most creative during Pisces transits',
    'Your energy dips during Mercury retrogrades',
    'Journaling increases on Full Moon days by 3×',
  ],
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

async function hapticLight() {
  if (Platform.OS === 'ios') {
    await hapticImpact('Light');
  }
}

async function hapticMedium() {
  if (Platform.OS === 'ios') {
    await hapticImpact('Medium');
  }
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Journal Modal
// ─────────────────────────────────────────────────────────────

const MOODS = ['✨', '🌊', '🔥', '💜', '🌙', '☀️', '💫', '🌸'];

function JournalModal({ 
  visible, 
  onClose, 
  prompt 
}: { 
  visible: boolean; 
  onClose: () => void; 
  prompt: string;
}) {
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState('✨');
  const { addEntry } = useJournalStore();

  const handleSave = async () => {
    if (!text.trim()) return;
    await hapticMedium();
    addEntry({ text, mood: selectedMood });
    setText('');
    setSelectedMood('✨');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <View style={{
          backgroundColor: colors.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        }}>
          <Text style={{ fontFamily: typography.fonts.displaySemiBold, fontSize: 20, color: colors.textPrimary, marginBottom: spacing.sm }}>
            Cosmic Journal ✍️
          </Text>
          <Text style={{ fontFamily: typography.fonts.displayItalic, fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md }}>
            {prompt}
          </Text>
          
          <Text style={{ fontFamily: typography.fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs }}>
            How are you feeling?
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md, flexWrap: 'wrap' }}>
            {MOODS.map((mood) => (
              <Pressable key={mood} onPress={() => setSelectedMood(mood)} style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: selectedMood === mood ? colors.primaryLight : colors.surface,
                borderWidth: selectedMood === mood ? 2 : 0,
                borderColor: colors.primary,
              }}>
                <Text style={{ fontSize: 20 }}>{mood}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            multiline
            placeholder="Write your thoughts..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: spacing.md,
              minHeight: 120,
              fontFamily: typography.fonts.body,
              fontSize: 16,
              color: colors.textPrimary,
              textAlignVertical: 'top',
              marginBottom: spacing.md,
            }}
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable onPress={onClose} style={{ flex: 1, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fonts.bodySemiBold, color: colors.textSecondary }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={{ flex: 1, padding: spacing.md, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fonts.bodySemiBold, color: colors.white }}>Save ✨</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MORNING RITUAL FLOW (new)
// ─────────────────────────────────────────────────────────────

const DEMO_USER_ID = 'demo-user-001';
const MORNING_RITUAL_TYPE = 'morning_ritual';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function MorningRitualFlow() {
  const router = useRouter();
  const [breathsDone, setBreathsDone] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [intention, setIntention] = useState('');
  const [intentionSaved, setIntentionSaved] = useState(false);
  const [readingDone, setReadingDone] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [lastCompletedAt, setLastCompletedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const breathProgress = useSharedValue(0);
  const breathPulse = useSharedValue(1);

  useEffect(() => {
    breathPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    const loadRitual = async () => {
      setIsLoading(true);
      try {
        const raw = await AsyncStorage.getItem('veya-morning-ritual');
        const data = raw ? JSON.parse(raw) : null;

        const today = getTodayDateString();
        const lastDate = data?.last_completed_at?.split('T')[0] || null;
        const isToday = lastDate === today;

        if (isToday && data) {
          const steps = data.steps || {};
          setBreathsDone(Boolean(steps.breathsDone));
          setIntentionSaved(Boolean(steps.intentionSaved));
          setIntention((steps.intention as string) || '');
          setReadingDone(Boolean(steps.readingDone));
          setCompletedToday(Boolean(data.completed_today));
          setLastCompletedAt(data.last_completed_at || null);
        } else {
          setBreathsDone(false);
          setIntentionSaved(false);
          setIntention('');
          setReadingDone(false);
          setCompletedToday(false);
          setLastCompletedAt(data?.last_completed_at || null);
        }
      } catch (err) {
        console.warn('[Rituals] load error:', err);
      }
      setIsLoading(false);
    };

    loadRitual();
  }, []);

  const persistRitual = async (overrides?: {
    breathsDone?: boolean;
    intentionSaved?: boolean;
    intention?: string;
    readingDone?: boolean;
  }) => {
    const nextBreaths = overrides?.breathsDone ?? breathsDone;
    const nextIntentionSaved = overrides?.intentionSaved ?? intentionSaved;
    const nextIntention = overrides?.intention ?? intention;
    const nextReading = overrides?.readingDone ?? readingDone;
    const completed = nextBreaths && nextIntentionSaved && nextReading;
    const nextLastCompleted = completed ? new Date().toISOString() : lastCompletedAt;

    try {
      const ritualData = {
        completed_today: completed,
        last_completed_at: nextLastCompleted,
        steps: {
          breathsDone: nextBreaths,
          intentionSaved: nextIntentionSaved,
          intention: nextIntentionSaved ? nextIntention : '',
          readingDone: nextReading,
        },
      };
      await AsyncStorage.setItem('veya-morning-ritual', JSON.stringify(ritualData));
      setCompletedToday(completed);
      setLastCompletedAt(nextLastCompleted);
    } catch (err) {
      console.warn('[Rituals] persist error:', err);
    }
  };

  const onBreathsComplete = () => {
    setBreathsDone(true);
    setIsBreathing(false);
    persistRitual({ breathsDone: true });
  };

  const startBreaths = () => {
    if (isBreathing || breathsDone) return;
    setIsBreathing(true);
    breathProgress.value = 0;
    breathProgress.value = withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }, (finished) => {
      if (finished) {
        runOnJS(onBreathsComplete)();
      }
    });
  };

  const saveIntention = () => {
    if (!intention.trim()) return;
    setIntentionSaved(true);
    persistRitual({ intentionSaved: true, intention: intention.trim() });
  };

  const openDailyBriefing = () => {
    setReadingDone(true);
    persistRitual({ readingDone: true });
    router.push('/(tabs)');
  };

  const breathProgressStyle = useAnimatedStyle(() => ({
    width: interpolate(breathProgress.value, [0, 1], [0, 180]),
  }));

  const breathPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathPulse.value }],
  }));

  return (
    <View style={styles.flowCard}>
      <Text style={styles.flowTitle}>Morning Ritual</Text>
      <Text style={styles.flowSubtitle}>Begin your day with a gentle reset</Text>

      {/* Step 1 */}
      <View style={styles.stepRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>1</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Take 3 deep breaths</Text>
          <View style={styles.breathRow}>
            <Animated.View style={[styles.breathCircle, breathPulseStyle]} />
            <View style={styles.breathBar}>
              <Animated.View style={[styles.breathProgress, breathProgressStyle]} />
            </View>
          </View>
          <Pressable style={styles.primaryButton} onPress={startBreaths}>
            <Text style={styles.primaryButtonText}>
              {breathsDone ? 'Completed ✓' : isBreathing ? 'Breathing...' : 'Start 3 breaths'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.stepCheck}>{breathsDone ? '✅' : '⬜️'}</Text>
      </View>

      {/* Step 2 */}
      <View style={styles.stepRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>2</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Set your intention for today</Text>
          <TextInput
            style={styles.intentionInput}
            placeholder="I choose to..."
            placeholderTextColor={themeColors.textMuted}
            value={intention}
            onChangeText={setIntention}
            editable={!intentionSaved}
          />
          <Pressable style={styles.secondaryButton} onPress={saveIntention}>
            <Text style={styles.secondaryButtonText}>
              {intentionSaved ? 'Saved ✓' : 'Save intention'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.stepCheck}>{intentionSaved ? '✅' : '⬜️'}</Text>
      </View>

      {/* Step 3 */}
      <View style={[styles.stepRow, { marginBottom: 0 }]}> 
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>3</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Read your daily briefing</Text>
          <Pressable style={styles.linkButton} onPress={openDailyBriefing}>
            <Text style={styles.linkButtonText}>Go to Today →</Text>
          </Pressable>
        </View>
        <Text style={styles.stepCheck}>{readingDone ? '✅' : '⬜️'}</Text>
      </View>

      {completedToday && (
        <Animated.View entering={FadeInUp.duration(600)} style={styles.completeBanner}>
          <Text style={styles.completeText}>🌞 Ritual complete — you’re aligned for the day</Text>
        </Animated.View>
      )}

      {isLoading && (
        <Text style={styles.loadingHint}>Saving your ritual...</Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Practice Header
// ─────────────────────────────────────────────────────────────

function PracticeHeader() {
  const flameScale = useSharedValue(1);

  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(800).delay(100)} style={styles.headerContainer}>
      <View style={styles.headerTitleRow}>
        <Animated.Text entering={FadeInDown.duration(500).delay(200)} style={styles.headerTitle}>
          Your Practice
        </Animated.Text>
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.streakBadge}>
          <Animated.Text style={[styles.streakFlame, flameAnimatedStyle]}>🔥</Animated.Text>
          <Text style={styles.streakText}>{MOCK.streakCount} day streak</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.streakDotsRow}>
        {MOCK.streakDays.map((completed, index) => (
          <View key={index} style={styles.streakDayColumn}>
            <View style={[
              styles.streakDot,
              completed ? styles.streakDotFilled : styles.streakDotEmpty,
              index === 6 && !completed && styles.streakDotToday,
            ]}>
              {completed && <Text style={styles.streakDotCheck}>✓</Text>}
              {index === 6 && !completed && <View style={styles.streakDotTodayInner} />}
            </View>
            <Text style={[styles.streakDayLabel, index === 6 && styles.streakDayLabelToday]}>
              {MOCK.dayLabels[index]}
            </Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Morning Ritual Card ☀️
// ─────────────────────────────────────────────────────────────

function MorningRitualCard() {
  const pressScale = useSharedValue(1);
  const isComplete = MOCK.morningRitual.status === 'complete';

  const handlePressIn = () => {
    pressScale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };
  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 10, stiffness: 180 });
    hapticMedium();
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(600)}>
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, styles.ritualCard, cardAnimatedStyle]}
        accessibilityRole="button"
        accessibilityLabel="Morning ritual"
      >
        <LinearGradient
          colors={['#FFF3E0', '#FFCC80', '#F4A261', '#E76F51']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ritualGradientStrip}
        />
        <View style={styles.ritualCardContent}>
          <View style={styles.ritualHeaderRow}>
            <View style={styles.ritualIconContainer}>
              <LinearGradient colors={['#FFF3E0', '#FFCC80']} style={styles.ritualIconGradient}>
                <Text style={styles.ritualIcon}>☀️</Text>
              </LinearGradient>
            </View>
            <View style={styles.ritualTitleGroup}>
              <Text style={styles.ritualTitle}>Morning Ritual</Text>
              <Text style={styles.ritualSubtitle}>Set Your Intention</Text>
            </View>
            <View style={[styles.statusBadge, isComplete ? styles.statusBadgeComplete : styles.statusBadgeReady]}>
              <Text style={[styles.statusBadgeText, isComplete ? styles.statusBadgeTextComplete : styles.statusBadgeTextReady]}>
                {isComplete ? 'Complete ✓' : 'Ready'}
              </Text>
            </View>
          </View>

          <View style={styles.ritualPromptContainer}>
            <Text style={styles.ritualPromptLabel}>Today's Intention</Text>
            <Text style={styles.ritualPromptText}>{MOCK.morningRitual.intention}</Text>
          </View>

          <View style={styles.affirmationContainer}>
            <Text style={styles.affirmationText}>"{MOCK.morningRitual.affirmation}"</Text>
          </View>

          <View style={styles.ritualFooter}>
            <Text style={styles.ritualEnergyForecast}>⚡ {MOCK.morningRitual.energyForecast}</Text>
            <Text style={styles.ritualTime}>{MOCK.morningRitual.estimatedTime}</Text>
          </View>

          <View style={styles.ritualCtaRow}>
            <Text style={styles.ritualCtaText}>Begin your practice</Text>
            <Text style={styles.ritualCtaArrow}>→</Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Evening Ritual Card 🌙
// ─────────────────────────────────────────────────────────────

function EveningRitualCard() {
  const pressScale = useSharedValue(1);
  const isLocked = MOCK.eveningRitual.status === 'locked';
  const isComplete = MOCK.eveningRitual.status === 'complete';

  const handlePressIn = () => {
    if (!isLocked) pressScale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };
  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 10, stiffness: 180 });
    if (!isLocked) hapticMedium();
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const statusLabel = isComplete ? 'Complete ✓' : isLocked ? `Available at ${MOCK.eveningRitual.availableAt}` : 'Ready';

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(800)}>
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, styles.ritualCard, cardAnimatedStyle, isLocked && styles.ritualCardLocked]}
        accessibilityRole="button"
        accessibilityLabel="Evening ritual"
        disabled={isLocked}
      >
        <LinearGradient
          colors={['#E8EAF6', '#B39DDB', '#7E57C2', '#5C35A5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.ritualGradientStrip, isLocked && { opacity: 0.4 }]}
        />
        <View style={styles.ritualCardContent}>
          <View style={styles.ritualHeaderRow}>
            <View style={styles.ritualIconContainer}>
              <LinearGradient colors={['#E8EAF6', '#B39DDB']} style={styles.ritualIconGradient}>
                <Text style={[styles.ritualIcon, isLocked && { opacity: 0.5 }]}>🌙</Text>
              </LinearGradient>
            </View>
            <View style={styles.ritualTitleGroup}>
              <Text style={[styles.ritualTitle, isLocked && { opacity: 0.5 }]}>Evening Ritual</Text>
              <Text style={[styles.ritualSubtitle, isLocked && { opacity: 0.5 }]}>Reflect & Release</Text>
            </View>
            <View style={[
              styles.statusBadge,
              isComplete ? styles.statusBadgeComplete : isLocked ? styles.statusBadgeLocked : styles.statusBadgeReady,
            ]}>
              <Text style={[
                styles.statusBadgeText,
                isComplete ? styles.statusBadgeTextComplete : isLocked ? styles.statusBadgeTextLocked : styles.statusBadgeTextReady,
              ]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.eveningPreviewContainer}>
            {[
              { icon: '💭', text: 'Reflection prompt' },
              { icon: '🙏', text: '3 gratitudes' },
              { icon: '🎭', text: 'Mood check-in' },
            ].map((item, i) => (
              <View key={i} style={styles.eveningPreviewItem}>
                <Text style={[styles.eveningPreviewIcon, isLocked && { opacity: 0.4 }]}>{item.icon}</Text>
                <Text style={[styles.eveningPreviewText, isLocked && { opacity: 0.5 }]}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ritualFooter}>
            <Text style={[styles.ritualEnergyForecast, isLocked && { opacity: 0.4 }]}>
              {isLocked ? '🕐 Unlocks this evening' : '🌌 Wind down with the cosmos'}
            </Text>
            <Text style={[styles.ritualTime, isLocked && { opacity: 0.4 }]}>{MOCK.eveningRitual.estimatedTime}</Text>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Cosmic Journal Section ✍️
// ─────────────────────────────────────────────────────────────

function CosmicJournalSection({ onWrite }: { onWrite: () => void }) {
  const writeButtonScale = useSharedValue(1);
  const entries = useJournalStore((state) => state.entries);

  const handleWritePress = async () => {
    await hapticMedium();
    writeButtonScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onWrite();
  };

  const writeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: writeButtonScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1000)} style={styles.journalSection}>
      <Text style={styles.sectionTitle}>Cosmic Journal</Text>

      <View style={[styles.card, styles.journalPromptCard]}>
        <View style={styles.journalNotebookLines}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.journalLine} />
          ))}
        </View>
        <View style={styles.journalMarginLine} />
        <View style={styles.journalPromptContent}>
          <View style={styles.journalPromptHeader}>
            <Text style={styles.journalPromptLabel}>Today's Prompt ✍️</Text>
          </View>
          <Text style={styles.journalPromptText}>{MOCK.journal.todaysPrompt}</Text>
          <AnimatedPressable onPress={handleWritePress} style={[styles.writeButton, writeButtonStyle]}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.writeButtonGradient}
            >
              <Text style={styles.writeButtonText}>Write ✨</Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.recentEntriesContainer}>
        <Text style={styles.recentEntriesTitle}>Recent Entries</Text>
        {entries.length === 0 && (
          <Text style={styles.emptyEntriesText}>No entries yet — write your first reflection.</Text>
        )}
        {entries.slice(0, 3).map((entry, index) => (
          <Animated.View key={entry.id} entering={FadeInDown.duration(400).delay(1200 + index * 100)}>
            <Pressable onPress={() => hapticLight()} style={styles.recentEntryCard}>
              <View style={styles.recentEntryLeft}>
                <Text style={styles.recentEntryMood}>{entry.mood}</Text>
              </View>
              <View style={styles.recentEntryContent}>
                <Text style={styles.recentEntryDate}>{entry.dateLabel}</Text>
                <Text style={styles.recentEntryPreview} numberOfLines={1} ellipsizeMode="tail">
                  {entry.text}
                </Text>
              </View>
              <Text style={styles.recentEntryArrow}>›</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Insights Card (Premium)
// ─────────────────────────────────────────────────────────────

function InsightsCard() {
  const shimmer = useSharedValue(0);
  const entries = useJournalStore((state) => state.entries);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    generateJournalInsights(entries)
      .then((result) => {
        if (isActive) setInsights(result);
      })
      .catch(() => {})
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [entries]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.6, 1]),
  }));

  const displayInsights = insights.length
    ? insights
    : ['Gathering your cosmic patterns...', 'Your journal reveals hidden rhythms', 'Insights will appear as you reflect'];

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1400)}>
      <View style={[styles.card, styles.insightsCard]}>
        <LinearGradient
          colors={['rgba(201, 168, 76, 0.2)', 'rgba(139, 92, 246, 0.1)', 'rgba(201, 168, 76, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.insightsGradientBorder}
        />
        <View style={styles.insightsContent}>
          <View style={styles.insightsHeader}>
            <View>
              <Text style={styles.insightsTitle}>Your Cosmic Patterns</Text>
              <Text style={styles.insightsSubtitle}>AI-powered insights from your practice</Text>
            </View>
          </View>

          {displayInsights.slice(0, 3).map((insight, index) => (
            <Animated.View key={index} style={[styles.insightRow, shimmerStyle]}>
              <View style={styles.insightDot} />
              <Text style={styles.insightText}>{insight}</Text>
            </Animated.View>
          ))}

          {isLoading && <Text style={styles.insightsLoading}>Updating insights...</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES
// ─────────────────────────────────────────────────────────────

interface ParticleConfig {
  cx: number; cy: number; r: number; opacity: number;
  delay: number; duration: number; driftX: number; driftY: number; color: string;
}

function generateParticles(count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  const tones = [
    'rgba(212, 165, 71, 0.3)', 'rgba(179, 157, 219, 0.2)',
    'rgba(139, 92, 246, 0.12)', 'rgba(244, 162, 97, 0.15)',
  ];
  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH, cy: Math.random() * 250,
      r: Math.random() * 1.6 + 0.4, opacity: Math.random() * 0.25 + 0.06,
      delay: Math.random() * 4000, duration: Math.random() * 8000 + 6000,
      driftX: (Math.random() - 0.5) * 18, driftY: (Math.random() - 0.5) * 12,
      color: tones[Math.floor(Math.random() * tones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(10);

function StardustParticle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(config.delay, withRepeat(
      withSequence(
        withTiming(config.driftX, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(-config.driftX * 0.6, { duration: config.duration * 0.8, easing: Easing.inOut(Easing.sin) })
      ), -1, true
    ));
    translateY.value = withDelay(config.delay, withRepeat(
      withSequence(
        withTiming(config.driftY, { duration: config.duration * 1.1, easing: Easing.inOut(Easing.sin) }),
        withTiming(-config.driftY * 0.5, { duration: config.duration * 0.9, easing: Easing.inOut(Easing.sin) })
      ), -1, true
    ));
    opacity.value = withDelay(config.delay, withRepeat(
      withSequence(
        withTiming(config.opacity, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) }),
        withTiming(config.opacity * 0.15, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute', left: config.cx, top: config.cy,
        width: config.r * 2, height: config.r * 2,
        borderRadius: config.r, backgroundColor: config.color,
      }, animatedStyle]}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN: RitualsScreen
// ─────────────────────────────────────────────────────────────

export default function RitualsScreen() {
  const insets = useSafeAreaInsets();
  const [journalVisible, setJournalVisible] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FDFBF7', '#F8F4EC', '#FDFBF7']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {PARTICLES.map((p, i) => <StardustParticle key={i} config={p} />)}
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <MorningRitualFlow />
        <PracticeHeader />
        <MorningRitualCard />
        <EveningRitualCard />
        <CosmicJournalSection onWrite={() => setJournalVisible(true)} />
        <InsightsCard />
        <View style={{ height: 40 }} />
      </ScrollView>
      <JournalModal 
        visible={journalVisible} 
        onClose={() => setJournalVisible(false)}
        prompt={REAL_RITUAL.journalPrompt}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: CONTENT_PADDING, paddingBottom: spacing.lg },

  // Morning ritual flow
  flowCard: {
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginBottom: spacing.lg,
  },
  flowTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 20,
    color: themeColors.textPrimary,
  },
  flowSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: themeColors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: themeColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepBadgeText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    color: themeColors.primaryDark,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.bodySmall,
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepCheck: {
    fontSize: 16,
    marginLeft: spacing.sm,
    marginTop: 4,
  },
  breathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  breathCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: themeColors.accentGold,
  },
  breathBar: {
    width: 180,
    height: 6,
    backgroundColor: themeColors.surfaceAlt,
    borderRadius: 6,
    overflow: 'hidden',
  },
  breathProgress: {
    height: 6,
    backgroundColor: themeColors.accentGold,
    borderRadius: 6,
  },
  primaryButton: {
    backgroundColor: themeColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  primaryButtonText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    color: themeColors.white,
  },
  secondaryButton: {
    backgroundColor: themeColors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  secondaryButtonText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    color: themeColors.primaryDark,
  },
  intentionInput: {
    backgroundColor: themeColors.white,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: themeColors.textPrimary,
  },
  linkButton: {
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.bodySmall,
    color: themeColors.primary,
  },
  completeBanner: {
    marginTop: spacing.md,
    backgroundColor: themeColors.accentGoldLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  completeText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    color: themeColors.accentGold,
  },
  loadingHint: {
    marginTop: spacing.sm,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.tiny,
    color: themeColors.textMuted,
  },

  // Header
  headerContainer: { paddingTop: spacing.sm, paddingBottom: spacing.lg },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { fontFamily: typography.fonts.display, fontSize: typography.sizes.display2, color: colors.textPrimary, letterSpacing: 0.2 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.streakFlameBg,
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.12)',
  },
  streakFlame: { fontSize: 16, marginRight: 4 },
  streakText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.caption, color: colors.streakFlame, letterSpacing: 0.2 },
  streakDotsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  streakDayColumn: { alignItems: 'center', gap: 4 },
  streakDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  streakDotFilled: {
    backgroundColor: colors.doGreen,
    ...Platform.select({
      ios: { shadowColor: colors.doGreen, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  streakDotEmpty: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: '#EDE7DB' },
  streakDotToday: { borderColor: colors.primary, borderWidth: 2 },
  streakDotTodayInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryLight },
  streakDotCheck: { fontFamily: typography.fonts.bodySemiBold, fontSize: 16, color: colors.white },
  streakDayLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.tiny, color: colors.textMuted, letterSpacing: 0.3 },
  streakDayLabelToday: { color: colors.primary, fontFamily: typography.fonts.bodySemiBold },

  // Card base
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.cardBorder,
    ...Platform.select({
      ios: { shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },

  // Ritual cards
  ritualCard: { marginBottom: spacing.md, overflow: 'hidden' },
  ritualCardLocked: { opacity: 0.7 },
  ritualGradientStrip: { height: 4, width: '100%' },
  ritualCardContent: { padding: spacing.lg },
  ritualHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  ritualIconContainer: { marginRight: spacing.sm },
  ritualIconGradient: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ritualIcon: { fontSize: 22 },
  ritualTitleGroup: { flex: 1 },
  ritualTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2 },
  ritualSubtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textSecondary, marginTop: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  statusBadgeReady: { backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  statusBadgeComplete: { backgroundColor: colors.doGreenBg },
  statusBadgeLocked: { backgroundColor: colors.surface },
  statusBadgeText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny, letterSpacing: 0.3 },
  statusBadgeTextReady: { color: colors.primary },
  statusBadgeTextComplete: { color: colors.doGreen },
  statusBadgeTextLocked: { color: colors.textMuted },

  // Morning ritual
  ritualPromptContainer: { backgroundColor: 'rgba(255, 243, 224, 0.5)', borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm },
  ritualPromptLabel: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny, color: colors.sunriseOrange, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  ritualPromptText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, lineHeight: 21 },
  affirmationContainer: { borderLeftWidth: 3, borderLeftColor: colors.accentGold, paddingLeft: spacing.sm, marginBottom: spacing.md },
  affirmationText: { fontFamily: typography.fonts.displayItalic, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, lineHeight: 22.4, letterSpacing: 0.2 },
  ritualFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  ritualEnergyForecast: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted, flex: 1 },
  ritualTime: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.tiny, color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.sm, overflow: 'hidden' },
  ritualCtaRow: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: 'rgba(0, 0, 0, 0.04)' },
  ritualCtaText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.primary, flex: 1 },
  ritualCtaArrow: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.body, color: colors.primary },

  // Evening ritual
  eveningPreviewContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  eveningPreviewItem: { alignItems: 'center', flex: 1 },
  eveningPreviewIcon: { fontSize: 20, marginBottom: 4 },
  eveningPreviewText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.tiny, color: colors.textSecondary, textAlign: 'center' },

  // Journal
  journalSection: { marginBottom: spacing.lg },
  sectionTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2, marginBottom: spacing.sm },
  journalPromptCard: { marginBottom: spacing.md, overflow: 'hidden', position: 'relative' as const },
  journalNotebookLines: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-evenly' as const, paddingVertical: spacing.xxl },
  journalLine: { height: 1, backgroundColor: 'rgba(212, 165, 71, 0.06)', marginHorizontal: spacing.lg },
  journalMarginLine: { position: 'absolute' as const, left: 40, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(232, 120, 138, 0.1)' },
  journalPromptContent: { padding: spacing.lg, paddingLeft: spacing.xxl + spacing.xs },
  journalPromptHeader: { marginBottom: spacing.sm },
  journalPromptLabel: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.caption, color: colors.accentGold, letterSpacing: 0.3 },
  journalPromptText: { fontFamily: typography.fonts.displayItalic, fontSize: typography.sizes.body, color: colors.textPrimary, lineHeight: 25.6, letterSpacing: 0.2, marginBottom: spacing.lg },
  writeButton: { alignSelf: 'flex-start' as const, borderRadius: borderRadius.full, overflow: 'hidden' as const },
  writeButtonGradient: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  writeButtonText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.white, letterSpacing: 0.3 },
  recentEntriesContainer: { gap: spacing.xs },
  recentEntriesTitle: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 4 },
  emptyEntriesText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  recentEntryCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: colors.white,
    borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  recentEntryLeft: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.journalCream, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: spacing.sm },
  recentEntryMood: { fontSize: 16 },
  recentEntryContent: { flex: 1 },
  recentEntryDate: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny, color: colors.textMuted, letterSpacing: 0.3, marginBottom: 2 },
  recentEntryPreview: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textSecondary, lineHeight: 18.2 },
  recentEntryArrow: { fontFamily: typography.fonts.body, fontSize: 20, color: colors.textMuted, marginLeft: spacing.xs },

  // Journal modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading3,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  moodOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  moodOptionText: {
    fontSize: 18,
  },
  journalInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  modalCancelText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  modalSaveText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.bodySmall,
    color: colors.white,
  },

  // Insights
  insightsCard: { marginBottom: spacing.md, overflow: 'hidden' as const, position: 'relative' as const },
  insightsGradientBorder: { height: 3, width: '100%' },
  insightsContent: { padding: spacing.lg },
  insightsHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: spacing.md },
  insightsTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2 },
  insightsSubtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted, marginTop: 2 },
  premiumBadge: { backgroundColor: 'rgba(201, 168, 76, 0.1)', paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.2)' },
  premiumBadgeText: { fontFamily: typography.fonts.bodySemiBold, fontSize: 10, color: colors.premiumGold, letterSpacing: 0.3 },
  insightRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.sm },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: spacing.sm },
  insightText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, lineHeight: 21, flex: 1 },
  insightsLoading: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  insightsFrostOverlay: { position: 'absolute' as const, bottom: 60, left: 0, right: 0, height: 80 },
  insightsUnlockButton: { borderRadius: borderRadius.full, overflow: 'hidden' as const, marginTop: spacing.xs },
  insightsUnlockGradient: { paddingVertical: spacing.sm, borderRadius: borderRadius.full, alignItems: 'center' as const },
  insightsUnlockText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.white, letterSpacing: 0.3 },
});
