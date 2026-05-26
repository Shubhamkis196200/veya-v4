/**
 * VEYa — Screen 08: Methodology Selection ✨
 *
 * Users choose their preferred astrology system(s). Multi-select cards
 * with gold border on select, spring animation, and haptic feedback.
 *
 * Design direction: Luxury light theme · Cream background · Playfair + Inter ·
 * Warm gold accents · 2-column card grid · Matching visual language
 *
 * @module screens/onboarding/methodology
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,

} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Path,

} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ScreenErrorBoundary } from '@/components/shared/ScreenErrorBoundary';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const colors = {
  background: '#FDFBF7',
  surface: '#F5F0E8',
  surfaceAlt: '#EDE7DB',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9B9BAD',
  primary: '#8B5CF6',
  accentGold: '#D4A547',
  accentGoldLight: '#FDF4E3',
  white: '#FFFFFF',
  cardBorder: 'rgba(212, 165, 71, 0.15)',
  cardBorderSelected: '#D4A547',
} as const;

const typography = {
  fonts: {
    display: 'PlayfairDisplay-Bold',
    displayItalic: 'PlayfairDisplay-Italic',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
  },
  sizes: {
    display2: 28,
    body: 16,
    bodySmall: 14,
    caption: 13,
    tiny: 11,
  },
} as const;

const spacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
const borderRadius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 } as const;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 9;
const CURRENT_STEP = 7; // 0-indexed: step 7 of 10

const GRID_GAP = 12;
const GRID_PADDING = spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = 110;

// ─────────────────────────────────────────────────────────────
// METHODOLOGY DATA
// ─────────────────────────────────────────────────────────────

interface MethodologyItem {
  id: string;
  emoji: string;
  label: string;
  description: string;
  accentColor: string;
}

const METHODOLOGIES: MethodologyItem[] = [
  {
    id: 'western',
    emoji: '🌟',
    label: 'Western Tropical',
    description: 'The most popular system worldwide',
    accentColor: '#D4A547',
  },
  {
    id: 'vedic',
    emoji: '🕉️',
    label: 'Vedic Sidereal',
    description: 'Ancient Indian wisdom, star-based',
    accentColor: '#E8788A',
  },
  {
    id: 'chinese',
    emoji: '🐉',
    label: 'Chinese Zodiac',
    description: 'Year-based animal signs & elements',
    accentColor: '#E8664D',
  },
  {
    id: 'numerology',
    emoji: '🔢',
    label: 'Numerology',
    description: 'The hidden language of numbers',
    accentColor: '#8B5CF6',
  },
  {
    id: 'lunar',
    emoji: '🌙',
    label: 'Lunar Astrology',
    description: 'Moon-focused cosmic insights',
    accentColor: '#5B8DB8',
  },
];

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES (reduced for performance)
// ─────────────────────────────────────────────────────────────

interface ParticleConfig {
  cx: number; cy: number; r: number; opacity: number;
  delay: number; duration: number; driftX: number; driftY: number; color: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

function generateParticles(count: number): ParticleConfig[] {
  const tones = [
    'rgba(212, 165, 71, 0.4)', 'rgba(212, 165, 71, 0.25)',
    'rgba(139, 92, 246, 0.15)', 'rgba(212, 165, 71, 0.3)',
  ];
  return Array.from({ length: count }, (_, i) => ({
    cx: Math.random() * SCREEN_WIDTH,
    cy: Math.random() * SCREEN_HEIGHT,
    r: Math.random() * 1.8 + 0.4,
    opacity: Math.random() * 0.35 + 0.08,
    delay: Math.random() * 5000,
    duration: Math.random() * 7000 + 5000,
    driftX: (Math.random() - 0.5) * 20,
    driftY: (Math.random() - 0.5) * 25,
    color: tones[Math.floor(Math.random() * tones.length)],
  }));
}

const PARTICLES = generateParticles(5);

const StardustParticle = ({ config }: { config: ParticleConfig }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(config.delay,
      withRepeat(withSequence(
        withTiming(config.driftX, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(-config.driftX * 0.7, { duration: config.duration * 0.8, easing: Easing.inOut(Easing.sin) })
      ), -1, true)
    );
    translateY.value = withDelay(config.delay,
      withRepeat(withSequence(
        withTiming(config.driftY, { duration: config.duration * 1.1, easing: Easing.inOut(Easing.sin) }),
        withTiming(-config.driftY * 0.6, { duration: config.duration * 0.9, easing: Easing.inOut(Easing.sin) })
      ), -1, true)
    );
    opacity.value = withDelay(config.delay,
      withRepeat(withSequence(
        withTiming(config.opacity, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) }),
        withTiming(config.opacity * 0.2, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) })
      ), -1, true)
    );
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
};

// ─────────────────────────────────────────────────────────────
// PROGRESS DOTS
// ─────────────────────────────────────────────────────────────

function ProgressDots({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep && styles.progressDotActive,
            index < currentStep && styles.progressDotPast,
          ]}
        />
      ))}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// BACK BUTTON
// ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button" accessibilityLabel="Go back">
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path d="M15 19l-7-7 7-7" stroke={colors.textSecondary}
          strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// GOLD CHECKMARK
// ─────────────────────────────────────────────────────────────

function GoldCheckmark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Circle cx={9} cy={9} r={9} fill={colors.accentGold} />
      <Path d="M5.5 9.5L8 12L12.5 6.5" stroke={colors.white}
        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// METHODOLOGY CARD
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MethodologyCard = ({
  item, isSelected, onToggle, index,
}: {
  item: MethodologyItem; isSelected: boolean; onToggle: (id: string) => void; index: number;
}) => {
  const cardScale = useSharedValue(1);

  const handlePress = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    cardScale.value = withSequence(
      withTiming(0.94, { duration: 80, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 300, mass: 0.5 })
    );
    onToggle(item.id);
  }, [item.id, onToggle]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Animated.View style={cardAnimatedStyle}>
      <Pressable onPress={handlePress}
        style={[
          styles.methodCard,
          {
            borderColor: isSelected ? colors.accentGold : 'rgba(212, 165, 71, 0.12)',
            backgroundColor: isSelected ? 'rgba(253, 244, 227, 0.7)' : colors.white,
            borderWidth: isSelected ? 1.8 : 1,
          },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.label}: ${item.description}`}>
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <GoldCheckmark size={20} />
          </View>
        )}
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <Text style={styles.cardLabel}>{item.label}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────
// SELECTION COUNTER
// ─────────────────────────────────────────────────────────────

function SelectionCounter({ count }: { count: number }) {
  const counterScale = useSharedValue(1);
  useEffect(() => {
    if (count > 0) {
      counterScale.value = withSequence(
        withTiming(1.1, { duration: 100, easing: Easing.out(Easing.ease) }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  }, [count]);

  const counterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  if (count === 0) return null;
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.counterContainer, counterAnimatedStyle]}>
      <Text style={styles.counterText}>
        {count} {count === 1 ? 'system' : 'systems'} selected
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

function MethodologyScreenInner() {
  const insets = useSafeAreaInsets();
  const { data, updateData } = useOnboardingStore();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(data?.methodology?.length ? data.methodology : ['western'])
  );

  const hasSelection = selectedItems.size > 0;
  const buttonScale = useSharedValue(1);

  const handleToggle = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Don't allow deselecting the last item
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBack = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, []);

  const handleContinue = useCallback(async () => {
    if (!hasSelection) return;
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updateData({ methodology: Array.from(selectedItems) });
    router.push('/(auth)/onboarding/purpose');
  }, [hasSelection, selectedItems, updateData]);

  const handlePressIn = useCallback(() => {
    if (!hasSelection) return;
    buttonScale.value = withTiming(0.95, { duration: 100, easing: Easing.out(Easing.ease) });
  }, [hasSelection]);

  const handlePressOut = useCallback(() => {
    buttonScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const gridRows = useMemo(() => {
    const rows: MethodologyItem[][] = [];
    for (let i = 0; i < METHODOLOGIES.length; i += 2) {
      rows.push(METHODOLOGIES.slice(i, i + 2));
    }
    return rows;
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FDFBF7', '#FAF6EE', '#F5F0E8']} locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject} />

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {PARTICLES.map((p, i) => <StardustParticle key={i} config={p} />)}
      </View>

      <View style={[styles.content, {
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.lg,
      }]}>
        <Animated.View entering={FadeIn.duration(500).delay(50)} style={styles.header}>
          <BackButton onPress={handleBack} />
          <ProgressDots currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false} bounces>
          <Animated.Text entering={FadeInDown.duration(600).delay(150).easing(Easing.out(Easing.ease))}
            style={styles.headline} accessibilityRole="header">
            Choose Your{'\n'}Cosmic Path
          </Animated.Text>

          <Animated.Text entering={FadeInDown.duration(500).delay(250).easing(Easing.out(Easing.ease))}
            style={styles.subtext}>
            Select the systems that speak to you.{'\n'}We'll weave them together.
          </Animated.Text>

          <SelectionCounter count={selectedItems.size} />

          <View style={styles.grid}>
            {gridRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((item, colIndex) => (
                  <MethodologyCard key={item.id} item={item}
                    isSelected={selectedItems.has(item.id)}
                    onToggle={handleToggle} index={rowIndex * 2 + colIndex} />
                ))}
              </View>
            ))}
          </View>

          <View style={{ height: spacing.xxl + 20 }} />
        </ScrollView>

        <Animated.View entering={FadeInUp.duration(500).delay(600).easing(Easing.out(Easing.ease))}
          style={styles.ctaContainer}>
          <AnimatedPressable onPress={handleContinue} onPressIn={handlePressIn}
            onPressOut={handlePressOut} disabled={!hasSelection}
            style={[styles.ctaButton, buttonAnimatedStyle, { opacity: hasSelection ? 1 : 0.45 }]}
            accessibilityRole="button" accessibilityLabel="Continue"
            accessibilityState={{ disabled: !hasSelection }}>
            <Text style={styles.ctaText}>Continue</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </AnimatedPressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 44, marginBottom: spacing.xs,
  },
  backButton: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  headerSpacer: { width: 44 },
  progressContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  progressDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt,
  },
  progressDotActive: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentGold,
    ...Platform.select({
      ios: { shadowColor: colors.accentGold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  progressDotPast: { backgroundColor: colors.accentGold, opacity: 0.5 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  headline: {
    fontFamily: typography.fonts.display, fontSize: typography.sizes.display2,
    color: colors.textPrimary, textAlign: 'center',
    lineHeight: typography.sizes.display2 * 1.25, letterSpacing: 0.3,
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: { textShadowColor: 'rgba(212, 165, 71, 0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
      android: {},
    }),
  },
  subtext: {
    fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall,
    color: colors.textMuted, textAlign: 'center',
    lineHeight: typography.sizes.bodySmall * 1.6, letterSpacing: 0.2,
    marginBottom: spacing.md, paddingHorizontal: spacing.sm,
  },
  counterContainer: {
    alignSelf: 'center', marginBottom: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs / 2,
    backgroundColor: colors.accentGoldLight, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: 'rgba(212, 165, 71, 0.2)',
  },
  counterText: {
    fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.tiny,
    color: colors.accentGold, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  grid: { gap: GRID_GAP },
  gridRow: { flexDirection: 'row', gap: GRID_GAP },
  methodCard: {
    width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    position: 'relative', overflow: 'hidden',
  },
  checkmarkContainer: { position: 'absolute', top: 8, right: 8, zIndex: 2 },
  cardEmoji: { fontSize: 28, marginBottom: 4, lineHeight: 34 },
  cardLabel: {
    fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.caption,
    color: colors.textPrimary, textAlign: 'center', lineHeight: typography.sizes.caption * 1.3,
    letterSpacing: 0.1,
  },
  cardDescription: {
    fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny,
    color: colors.textMuted, textAlign: 'center', lineHeight: typography.sizes.tiny * 1.4,
    marginTop: 2, paddingHorizontal: 4,
  },
  ctaContainer: { paddingTop: spacing.sm, paddingBottom: spacing.xs },
  ctaButton: {
    backgroundColor: colors.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', height: 56,
    borderRadius: borderRadius.sm, gap: spacing.xs,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  ctaText: {
    fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.body,
    color: '#FFFFFF', letterSpacing: 0.5,
  },
  ctaArrow: {
    fontFamily: typography.fonts.body, fontSize: typography.sizes.body,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default function MethodologyScreen() {
  return (
    <ScreenErrorBoundary screenName="Methodology">
      <MethodologyScreenInner />
    </ScreenErrorBoundary>
  );
}
