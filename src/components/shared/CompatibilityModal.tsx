import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { generateCompatibility, type CompatibilityReport } from '@/services/ai';
import type { UserProfile } from '@/types';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

const colors = {
  background: '#FDFBF7',
  primary: '#8B5CF6',
  gold: '#D4A547',
  text: '#1A1A2E',
  textMuted: 'rgba(26, 26, 46, 0.6)',
  surface: '#FFFFFF',
  border: 'rgba(212, 165, 71, 0.18)',
  progressTrack: 'rgba(139, 92, 246, 0.12)',
  progressFill: '#8B5CF6',
  softGlow: 'rgba(139, 92, 246, 0.2)',
} as const;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  visible: boolean;
  onClose: () => void;
};

const DIMENSIONS = [
  { key: 'communication', label: 'Communication' },
  { key: 'emotional', label: 'Emotional' },
  { key: 'passion', label: 'Passion' },
  { key: 'growth', label: 'Growth' },
  { key: 'conflict', label: 'Challenge' },
  { key: 'longterm', label: 'Long-term' },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]['key'];

function getSunSign(month?: number, day?: number): string | undefined {
  if (!month || !day) return undefined;
  const md = month * 100 + day;
  if (md >= 321 && md <= 419) return 'Aries';
  if (md >= 420 && md <= 520) return 'Taurus';
  if (md >= 521 && md <= 620) return 'Gemini';
  if (md >= 621 && md <= 722) return 'Cancer';
  if (md >= 723 && md <= 822) return 'Leo';
  if (md >= 823 && md <= 922) return 'Virgo';
  if (md >= 923 && md <= 1022) return 'Libra';
  if (md >= 1023 && md <= 1121) return 'Scorpio';
  if (md >= 1122 && md <= 1221) return 'Sagittarius';
  if (md >= 1222 || md <= 119) return 'Capricorn';
  if (md >= 120 && md <= 218) return 'Aquarius';
  if (md >= 219 && md <= 320) return 'Pisces';
  return undefined;
}

function buildUserProfile(data: any): UserProfile {
  const now = new Date().toISOString();
  const precision = data.birthTimeKnown
    ? (data.birthTimePrecision === 'exact' || data.birthTimePrecision === 'approximate'
      ? data.birthTimePrecision
      : 'unknown')
    : 'unknown';

  return {
    id: 'local-user',
    user_id: 'local-user',
    display_name: data.name || 'You',
    name: data.name || 'You',
    email: null,
    avatar_url: null,
    birth_date: data.birthDate ? new Date(data.birthDate).toISOString() : null,
    birth_time: data.birthTime ? new Date(data.birthTime).toISOString() : null,
    birth_time_precision: precision,
    birth_time_range: null,
    birth_place: data.birthPlace || null,
    birth_latitude: data.birthLat,
    birth_longitude: data.birthLng,
    sun_sign: data.sunSign || null,
    moon_sign: null,
    rising_sign: null,
    focus_areas: data.focusAreas || [],
    personality_traits: [],
    interests: [],
    onboarding_completed: true,
    onboarding_step: 0,
    subscription_tier: 'free',
    created_at: now,
    updated_at: now,
  };
}

function ProgressRing({ score }: { score: number }) {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.progressTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.progressFill}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
      <View style={styles.ringLabelWrap}>
        <Text style={styles.ringScore}>{score}</Text>
        <Text style={styles.ringCaption}>Overall</Text>
      </View>
    </View>
  );
}

function DimensionBar({ label, score, summary }: { label: string; score: number; summary: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [score]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.dimensionRow}>
      <View style={styles.dimensionHeader}>
        <Text style={styles.dimensionLabel}>{label}</Text>
        <Text style={styles.dimensionScore}>{score}%</Text>
      </View>
      <View style={styles.dimensionTrack}>
        <Animated.View style={[styles.dimensionFill, barStyle]} />
      </View>
      <Text style={styles.dimensionSummary}>{summary}</Text>
    </View>
  );
}

export default function CompatibilityModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();
  const userProfile = useMemo(() => buildUserProfile(data), [data]);

  const [step, setStep] = useState(1);
  const [partnerName, setPartnerName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [partnerMoonSign, setPartnerMoonSign] = useState('');
  const [partnerRisingSign, setPartnerRisingSign] = useState('');
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const glowPulse = useSharedValue(0.4);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setPartnerName('');
      setBirthMonth('');
      setBirthDay('');
      setBirthYear('');
      setBirthPlace('');
      setPartnerMoonSign('');
      setPartnerRisingSign('');
      setReport(null);
      setError(null);
      setIsLoading(false);
    }
  }, [visible]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
    transform: [{ scale: 0.98 + glowPulse.value * 0.04 }],
  }));

  const formattedDate = useMemo(() => {
    if (!birthMonth || !birthDay || !birthYear) return '';
    return `${birthMonth.padStart(2, '0')}/${birthDay.padStart(2, '0')}/${birthYear}`;
  }, [birthMonth, birthDay, birthYear]);

  const sunSign = useMemo(() => {
    const month = parseInt(birthMonth, 10);
    const day = parseInt(birthDay, 10);
    return getSunSign(Number.isNaN(month) ? undefined : month, Number.isNaN(day) ? undefined : day);
  }, [birthMonth, birthDay]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const partnerDisplayName = partnerName.trim() || 'Your partner';
      const partnerLabel = birthPlace.trim()
        ? `${partnerDisplayName} (born in ${birthPlace.trim()})`
        : partnerDisplayName;
      const result = await generateCompatibility(
        userProfile,
        {
          name: partnerLabel,
          sun_sign: sunSign,
          moon_sign: partnerMoonSign || undefined,
          rising_sign: partnerRisingSign || undefined,
        },
      );
      setReport(result);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 4) {
      handleGenerate();
    }
  }, [step]);

  const canContinueName = partnerName.trim().length > 0;
  const canContinueDate = birthMonth.trim().length > 0 && birthDay.trim().length > 0 && birthYear.trim().length >= 4;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}> 
        <LinearGradient
          colors={[colors.background, '#F8F4EC', colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Compatibility</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        {step <= 3 && (
          <View style={styles.stepIndicator}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
            ))}
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Partner's Name</Text>
            <Text style={styles.stepTitle}>Who are we reading for?</Text>
            <TextInput
              value={partnerName}
              onChangeText={setPartnerName}
              placeholder="e.g. Jamie"
              placeholderTextColor="rgba(26, 26, 46, 0.4)"
              style={styles.textInput}
            />
            <View style={styles.actionsRow}>
              <View style={{ flex: 1 }} />
              <Pressable
                disabled={!canContinueName}
                onPress={() => setStep(2)}
                style={[styles.primaryButton, !canContinueName && styles.primaryButtonDisabled]}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Partner's Birth Date</Text>
            <Text style={styles.stepTitle}>When were they born?</Text>
            <View style={styles.dateRow}>
              <TextInput
                value={birthMonth}
                onChangeText={(text) => setBirthMonth(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                placeholder="MM"
                placeholderTextColor="rgba(26, 26, 46, 0.4)"
                style={[styles.textInput, styles.dateInput]}
              />
              <TextInput
                value={birthDay}
                onChangeText={(text) => setBirthDay(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                placeholder="DD"
                placeholderTextColor="rgba(26, 26, 46, 0.4)"
                style={[styles.textInput, styles.dateInput]}
              />
              <TextInput
                value={birthYear}
                onChangeText={(text) => setBirthYear(text.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                placeholder="YYYY"
                placeholderTextColor="rgba(26, 26, 46, 0.4)"
                style={[styles.textInput, styles.dateInput, styles.yearInput]}
              />
            </View>
            {!!sunSign && (
              <Text style={styles.sunSignHint}>Sun sign: {sunSign}</Text>
            )}
            <View style={styles.actionsRow}>
              <Pressable onPress={() => setStep(1)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>
              <Pressable
                disabled={!canContinueDate}
                onPress={() => setStep(3)}
                style={[styles.primaryButton, !canContinueDate && styles.primaryButtonDisabled]}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepLabel}>Additional Details (Optional)</Text>
            <Text style={styles.stepTitle}>Know their Moon or Rising?</Text>
            <Text style={styles.stepSubtitle}>Adding these creates a deeper synastry reading</Text>
            
            <TextInput
              value={birthPlace}
              onChangeText={setBirthPlace}
              placeholder="Birth place (City, Country)"
              placeholderTextColor="rgba(26, 26, 46, 0.4)"
              style={[styles.textInput, { marginBottom: 12 }]}
            />
            
            <TextInput
              value={partnerMoonSign}
              onChangeText={setPartnerMoonSign}
              placeholder="Moon sign (e.g. Pisces)"
              placeholderTextColor="rgba(26, 26, 46, 0.4)"
              style={[styles.textInput, { marginBottom: 12 }]}
              autoCapitalize="words"
            />
            
            <TextInput
              value={partnerRisingSign}
              onChangeText={setPartnerRisingSign}
              placeholder="Rising sign (e.g. Leo)"
              placeholderTextColor="rgba(26, 26, 46, 0.4)"
              style={styles.textInput}
              autoCapitalize="words"
            />
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.actionsRow}>
              <Pressable onPress={() => setStep(2)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(4)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Reveal Results ✨</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.loadingWrap}>
            <Animated.View style={[styles.loadingGlow, glowStyle]} />
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Calculating your cosmic chemistry…</Text>
            {formattedDate ? (
              <Text style={styles.loadingSubtitle}>{partnerName} · {formattedDate}</Text>
            ) : (
              <Text style={styles.loadingSubtitle}>Aligning your charts</Text>
            )}
            {isLoading && (
              <View style={styles.loadingDots}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[styles.loadingDot, { opacity: 0.3 + i * 0.2 }]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {step === 5 && report && (
          <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultsTitle}>Your Cosmic Chemistry</Text>
            <Text style={styles.resultsSubtitle}>{partnerName || 'Your partner'}</Text>

            <ProgressRing score={report.overall_score} />

            <View style={styles.dimensionsWrap}>
              {DIMENSIONS.map((dimension) => {
                const data = report.dimensions[dimension.key as DimensionKey];
                return (
                  <DimensionBar
                    key={dimension.key}
                    label={dimension.label}
                    score={data.score}
                    summary={data.summary}
                  />
                );
              })}
            </View>

            <View style={styles.narrativeCard}>
              <Text style={styles.narrativeTitle}>Cosmic Narrative</Text>
              <Text style={styles.narrativeText}>{report.narrative}</Text>
            </View>

            <View style={styles.listCard}>
              <Text style={styles.listTitle}>Strengths</Text>
              {report.strengths.length === 0 ? (
                <Text style={styles.listEmpty}>No strengths noted yet.</Text>
              ) : (
                report.strengths.map((item, idx) => (
                  <Text key={`strength-${idx}`} style={styles.listItem}>• {item}</Text>
                ))
              )}
            </View>

            <View style={styles.listCard}>
              <Text style={styles.listTitle}>Challenges</Text>
              {report.challenges.length === 0 ? (
                <Text style={styles.listEmpty}>No challenges noted yet.</Text>
              ) : (
                report.challenges.map((item, idx) => (
                  <Text key={`challenge-${idx}`} style={styles.listItem}>• {item}</Text>
                ))
              )}
            </View>

            <Pressable style={styles.shareButton}>
              <LinearGradient
                colors={[colors.primary, '#6D28D9']}
                style={styles.shareGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.shareText}>Share Results</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={onClose} style={styles.closeResultsButton}>
              <Text style={styles.closeResultsText}>Close</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.heading1,
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textMuted,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  stepTitle: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.heading2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 10,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
  },
  yearInput: {
    flex: 1.3,
  },
  sunSignHint: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.surface,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  secondaryButtonText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.text,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  loadingGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.softGlow,
  },
  loadingTitle: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.heading2,
    color: colors.text,
    marginTop: spacing.lg,
  },
  loadingSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.md,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ringLabelWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringScore: {
    fontFamily: typography.fonts.display,
    fontSize: 36,
    color: colors.text,
  },
  ringCaption: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  resultsContent: {
    paddingBottom: spacing.xl,
  },
  resultsTitle: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.heading1,
    color: colors.text,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  dimensionsWrap: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dimensionRow: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dimensionLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.text,
  },
  dimensionScore: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.primary,
  },
  dimensionTrack: {
    height: 8,
    backgroundColor: colors.progressTrack,
    borderRadius: 999,
    overflow: 'hidden',
  },
  dimensionFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  dimensionSummary: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  narrativeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  narrativeTitle: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  narrativeText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.text,
    lineHeight: typography.sizes.bodySmall * 1.6,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  listTitle: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  listItem: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.text,
    marginBottom: 4,
  },
  listEmpty: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
  shareButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  shareGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shareText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.surface,
  },
  closeResultsButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  closeResultsText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
  },
  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: '#B42318',
    marginBottom: spacing.sm,
  },
});
