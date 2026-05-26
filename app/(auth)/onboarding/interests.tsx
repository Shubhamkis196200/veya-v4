/**
 * VEYa — Screen 08: Interests / Focus Areas ✨ (FINAL ONBOARDING SCREEN)
 *
 * The satisfying conclusion to onboarding. The user selects which areas
 * of life they want cosmic guidance on. Multi-select grid with elegant
 * toggle animations, culminating in a celebratory "Complete Your Profile" CTA.
 *
 * This screen should feel like the finish line — exciting, personal,
 * and forward-looking. Every dot is filled. The journey is complete.
 *
 * Animation Sequence:
 *   1. Screen fades in with progress dots (all 8 filled!) (0.4s)
 *   2. Headline + subtext slide in (0.6s)
 *   3. Interest cards stagger in from bottom, 2 columns (0.8s total)
 *   4. CTA appears last, with a subtle shimmer (0.5s)
 *   → Cards toggle with spring animation + gold glow
 *   → CTA has continuous shimmer when enabled
 *   → Final tap triggers celebration haptic
 *
 * Design direction: Luxury light theme · Cream background · Playfair + Inter ·
 * Warm gold accents · Elegant tile grid · Celebratory finish
 *
 * @module screens/onboarding/focus-areas
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  runOnJS,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  Line,
  Rect,

} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (identical to Screens 01–07)
// ─────────────────────────────────────────────────────────────

const colors = {
  background: '#FDFBF7',
  surface: '#F5F0E8',
  surfaceAlt: '#EDE7DB',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9B9BAD',
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#EDE9FE',
  accentGold: '#D4A547',
  accentGoldLight: '#FDF4E3',
  accentGoldDim: 'rgba(212, 165, 71, 0.3)',
  accentRose: '#E8788A',
  cosmicPurple: '#8B5CF6',
  cosmicPurpleDim: 'rgba(139, 92, 246, 0.25)',
  white: '#FFFFFF',
  overlay: 'rgba(26, 26, 46, 0.7)',
  error: '#D4564E',
  // Card states
  cardBorder: 'rgba(212, 165, 71, 0.15)',
  cardBorderSelected: '#D4A547',
  cardBgSelected: 'rgba(212, 165, 71, 0.06)',
  cardCheckmark: '#D4A547',
} as const;

const typography = {
  fonts: {
    display: 'PlayfairDisplay-Bold',
    displaySemiBold: 'PlayfairDisplay-SemiBold',
    displayRegular: 'PlayfairDisplay-Regular',
    displayItalic: 'PlayfairDisplay-Italic',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
  },
  sizes: {
    display1: 34,
    display2: 28,
    heading1: 26,
    heading2: 22,
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
  xxxl: 64,
} as const;

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// DIMENSIONS & CONSTANTS
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 9;
const CURRENT_STEP = 9; // 0-indexed: step 9 of 10 (ALL dots filled — last screen!)

// Grid layout
const GRID_GAP = 12;
const GRID_PADDING = spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = 100;

// ─────────────────────────────────────────────────────────────
// INTEREST AREA DATA
// Each area has a custom SVG icon rendered inline for elegance,
// an emoji fallback, a label, and a unique accent color tint.
// ─────────────────────────────────────────────────────────────

interface InterestArea {
  id: string;
  emoji: string;
  label: string;
  accentColor: string;
  accentColorDim: string;
}

const INTEREST_AREAS: InterestArea[] = [
  {
    id: 'love',
    emoji: '💕',
    label: 'Love &\nRelationships',
    accentColor: '#E8788A',
    accentColorDim: 'rgba(232, 120, 138, 0.12)',
  },
  {
    id: 'career',
    emoji: '💼',
    label: 'Career &\nPurpose',
    accentColor: '#8B5CF6',
    accentColorDim: 'rgba(139, 92, 246, 0.12)',
  },
  {
    id: 'growth',
    emoji: '🌱',
    label: 'Personal\nGrowth',
    accentColor: '#6B8E6B',
    accentColorDim: 'rgba(107, 142, 107, 0.12)',
  },
  {
    id: 'wellness',
    emoji: '🧘',
    label: 'Wellness &\nEnergy',
    accentColor: '#5B8DB8',
    accentColorDim: 'rgba(91, 141, 184, 0.12)',
  },
  {
    id: 'money',
    emoji: '💰',
    label: 'Money &\nAbundance',
    accentColor: '#D4A547',
    accentColorDim: 'rgba(212, 165, 71, 0.12)',
  },
  {
    id: 'creativity',
    emoji: '🎨',
    label: 'Creativity &\nExpression',
    accentColor: '#E8664D',
    accentColorDim: 'rgba(232, 102, 77, 0.12)',
  },
  {
    id: 'social',
    emoji: '👥',
    label: 'Friendships\n& Social',
    accentColor: '#C4A0E8',
    accentColorDim: 'rgba(196, 160, 232, 0.12)',
  },
  {
    id: 'spiritual',
    emoji: '🔮',
    label: 'Spiritual\nPath',
    accentColor: '#7B9FCC',
    accentColorDim: 'rgba(123, 159, 204, 0.12)',
  },
];

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES (consistent with Screens 01–07)
// Slightly calmer for this screen — the cards are the focus.
// ─────────────────────────────────────────────────────────────

interface ParticleConfig {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  color: string;
}

function generateParticles(count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  const tones = [
    'rgba(212, 165, 71, 0.4)',
    'rgba(212, 165, 71, 0.25)',
    'rgba(139, 92, 246, 0.15)',
    'rgba(232, 120, 138, 0.12)',
    'rgba(212, 165, 71, 0.3)',
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH,
      cy: Math.random() * SCREEN_HEIGHT,
      r: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.35 + 0.08,
      delay: Math.random() * 5000,
      duration: Math.random() * 7000 + 5000,
      driftX: (Math.random() - 0.5) * 20,
      driftY: (Math.random() - 0.5) * 25,
      color: tones[Math.floor(Math.random() * tones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(5);

const StardustParticle = React.memo(function StardustParticle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftX, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(-config.driftX * 0.7, { duration: config.duration * 0.8, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftY, { duration: config.duration * 1.1, easing: Easing.inOut(Easing.sin) }),
          withTiming(-config.driftY * 0.6, { duration: config.duration * 0.9, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.opacity, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) }),
          withTiming(config.opacity * 0.2, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.cx,
          top: config.cy,
          width: config.r * 2,
          height: config.r * 2,
          borderRadius: config.r,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
});

// ─────────────────────────────────────────────────────────────
// PROGRESS INDICATOR — ALL DOTS FILLED (8/8)
// The last dot is active/gold. All previous are filled gold (past).
// This is the culmination — visually satisfying "all complete."
// ─────────────────────────────────────────────────────────────

function ProgressDots({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(100)}
      style={styles.progressContainer}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        const isPast = index < currentStep;
        return (
          <View
            key={index}
            style={[
              styles.progressDot,
              isActive && styles.progressDotActive,
              isPast && styles.progressDotPast,
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// BACK BUTTON (identical to Screens 01–07)
// ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the personality snapshot screen"
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M15 19l-7-7 7-7"
          stroke={colors.textSecondary}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// GOLD CHECKMARK SVG
// A small, elegant gold checkmark that appears inside selected cards.
// Crisp at all sizes with proper stroke properties.
// ─────────────────────────────────────────────────────────────

function GoldCheckmark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Circle cx={9} cy={9} r={9} fill={colors.accentGold} />
      <Path
        d="M5.5 9.5L8 12L12.5 6.5"
        stroke={colors.white}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// INTEREST CARD (individual selectable tile)
//
// States:
//   - Unselected: cream/white bg, subtle border, no checkmark
//   - Selected: gold border, warm gold tint, gold checkmark, subtle glow
//
// Animation:
//   - Spring scale on toggle (satisfying bounce)
//   - Border color interpolation
//   - Background tint fade
//   - Checkmark scale-in with spring
//   - Shadow glow on selected
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface InterestCardProps {
  area: InterestArea;
  isSelected: boolean;
  onToggle: (id: string) => void;
  index: number;
}

function InterestCard({ area, isSelected, onToggle, index }: InterestCardProps) {
  const selectionProgress = useSharedValue(isSelected ? 1 : 0);
  const cardScale = useSharedValue(1);
  const checkmarkScale = useSharedValue(isSelected ? 1 : 0);
  const enterDelay = 300 + index * 40; // Staggered entrance

  // Update animation when selection changes
  useEffect(() => {
    selectionProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
    checkmarkScale.value = isSelected
      ? withSpring(1, { damping: 12, stiffness: 200, mass: 0.6 })
      : withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });
  }, [isSelected]);

  const handlePress = useCallback(async () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Bounce animation
    cardScale.value = withSequence(
      withTiming(0.94, { duration: 80, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 300, mass: 0.5 })
    );

    onToggle(area.id);
  }, [area.id, onToggle]);

  // ── Animated styles ──

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const selected = selectionProgress.value;
    const shadowOpacity = interpolate(selected, [0, 1], [0.04, 0.18]);
    const shadowRadius = interpolate(selected, [0, 1], [6, 16]);
    const borderWidth = interpolate(selected, [0, 1], [1, 1.8]);

    return {
      transform: [{ scale: cardScale.value }],
      borderColor: selected > 0.5 ? colors.accentGold : 'rgba(212, 165, 71, 0.12)',
      backgroundColor: selected > 0.5 ? 'rgba(253, 244, 227, 0.7)' : colors.white,
      borderWidth,
      ...Platform.select({
        ios: {
          shadowColor: colors.accentGold,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity,
          shadowRadius,
        },
        android: {
          elevation: interpolate(selectionProgress.value, [0, 1], [1, 4]),
        },
      }),
    };
  });

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkScale.value,
  }));

  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(selectionProgress.value, [0, 1], [1, 1.08]),
      },
    ],
  }));

  return (
    <Animated.View
      entering={FadeInUp.duration(400)
        .delay(enterDelay)
        .easing(Easing.out(Easing.cubic))}
    >
      <AnimatedPressable
        onPress={handlePress}
        style={[styles.interestCard, cardAnimatedStyle]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={area.label.replace('\n', ' ')}
        accessibilityHint={`${isSelected ? 'Deselect' : 'Select'} ${area.label.replace('\n', ' ')} for cosmic guidance`}
      >
        {/* Checkmark (top-right corner) */}
        <Animated.View style={[styles.checkmarkContainer, checkmarkAnimatedStyle]}>
          <GoldCheckmark size={20} />
        </Animated.View>

        {/* Emoji icon */}
        <Animated.Text style={[styles.cardEmoji, emojiAnimatedStyle]}>
          {area.emoji}
        </Animated.Text>

        {/* Label */}
        <Text style={styles.cardLabel}>{area.label}</Text>

        {/* Subtle accent dot (bottom-center decorative element) */}
        <View
          style={[
            styles.accentDot,
            { backgroundColor: isSelected ? area.accentColor : 'transparent' },
          ]}
        />
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// SELECTION COUNTER
// Shows "X areas selected" with a subtle animation on count change.
// Helps users feel their progress toward completing the screen.
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
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.counterContainer, counterAnimatedStyle]}
    >
      <Text style={styles.counterText}>
        {count} {count === 1 ? 'area' : 'areas'} selected
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// SHIMMER ANIMATION for the CTA button
// Creates a subtle left-to-right shine effect on the button
// surface, giving it a premium "finish line" feel.
// ─────────────────────────────────────────────────────────────

function ShimmerOverlay() {
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    shimmerPosition.value = withDelay(
      2000, // Start after button appears
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withDelay(3000, withTiming(-1, { duration: 0 }))
        ),
        -1,
        false
      )
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerPosition.value, [-1, 1], [-200, SCREEN_WIDTH]) },
    ],
    opacity: interpolate(shimmerPosition.value, [-1, -0.5, 0, 0.5, 1], [0, 0.3, 0.5, 0.3, 0]),
  }));

  return (
    <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.25)',
          'rgba(255, 255, 255, 0)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// CELEBRATION BURST
// Tiny gold particles that burst outward when the CTA is tapped.
// Creates a brief, delightful "completion" moment.
// ─────────────────────────────────────────────────────────────

// Individual burst particle — extracted to avoid useAnimatedStyle inside .map()
function BurstParticle({
  angle, distance, size, burstProgress,
}: {
  angle: number; distance: number; size: number; burstProgress: { value: number };
}) {
  const particleStyle = useAnimatedStyle(() => {
    const progress = burstProgress.value;
    const x = Math.cos(angle) * distance * progress;
    const y = Math.sin(angle) * distance * progress;
    return {
      position: 'absolute' as const,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.accentGold,
      transform: [{ translateX: x }, { translateY: y }],
      opacity: interpolate(progress, [0, 0.3, 1], [0, 1, 0]),
    };
  });

  return <Animated.View style={particleStyle} />;
}

function CelebrationBurst({ active }: { active: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        angle: (i / 12) * Math.PI * 2,
        distance: 30 + Math.random() * 40,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 100,
      })),
    []
  );

  const burstProgress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      burstProgress.value = 0;
      burstProgress.value = withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [active]);

  return (
    <View style={styles.celebrationContainer} pointerEvents="none">
      {particles.map((p, i) => (
        <BurstParticle
          key={i}
          angle={p.angle}
          distance={p.distance}
          size={p.size}
          burstProgress={burstProgress}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: InterestsScreen (Screen 8 — Final Onboarding)
// ─────────────────────────────────────────────────────────────

export default function InterestsScreen() {
  const insets = useSafeAreaInsets();
  const { data, updateData, completeOnboarding } = useOnboardingStore();
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    new Set(data?.focusAreas || [])
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const hasSelection = selectedAreas.size > 0;

  // ── CTA button animation ──
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);

  useEffect(() => {
    // Subtle pulsing glow when button is enabled
    if (hasSelection) {
      buttonGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      buttonGlow.value = withTiming(0, { duration: 300 });
    }
  }, [hasSelection]);

  // ── Handlers ──

  const handleToggle = useCallback((id: string) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
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

  const handleComplete = useCallback(async () => {
    if (!hasSelection) return;

    // Celebration haptic! This is the big moment.
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Trigger celebration burst
    setShowCelebration(true);

    // Save focus areas to store
    updateData({ focusAreas: Array.from(selectedAreas) });

    // Mark onboarding as completed
    completeOnboarding();

    // Brief delay for celebration animation, then navigate
    setTimeout(() => {
      // Navigate directly to tabs. Dismiss calls can cause blank screens in Expo Go.
      router.replace('/(tabs)');
    }, 600);
  }, [hasSelection, selectedAreas, updateData, completeOnboarding]);

  const handlePressIn = useCallback(() => {
    if (!hasSelection) return;
    buttonScale.value = withTiming(0.95, { duration: 100, easing: Easing.out(Easing.ease) });
  }, [hasSelection]);

  const handlePressOut = useCallback(() => {
    buttonScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
  }, []);

  // ── Animated styles ──

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    ...Platform.select({
      ios: {
        shadowOpacity: interpolate(buttonGlow.value, [0, 1], [0.3, 0.55]),
        shadowRadius: interpolate(buttonGlow.value, [0, 1], [12, 22]),
      },
      android: {},
    }),
  }));

  const buttonOpacityStyle = useAnimatedStyle(() => ({
    opacity: hasSelection ? 1 : 0.45,
  }));

  // ── Render grid rows (2 columns) ──
  const gridRows = useMemo(() => {
    const rows: InterestArea[][] = [];
    for (let i = 0; i < INTEREST_AREAS.length; i += 2) {
      rows.push(INTEREST_AREAS.slice(i, i + 2));
    }
    return rows;
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={['#FDFBF7', '#FAF6EE', '#F5F0E8']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Stardust particles ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <StardustParticle key={i} config={p} />
        ))}
      </View>

      {/* ── Main content ── */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {/* ── Header: Back + Progress ── */}
        <Animated.View
          entering={FadeIn.duration(500).delay(50)}
          style={styles.header}
        >
          <BackButton onPress={handleBack} />
          <ProgressDots currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* ── Headline ── */}
          <Animated.Text
            entering={FadeInDown.duration(600)
              .delay(150)
              .easing(Easing.out(Easing.ease))}
            style={styles.headline}
            accessibilityRole="header"
          >
            What Matters{'\n'}Most to You?
          </Animated.Text>

          {/* ── Subtext ── */}
          <Animated.Text
            entering={FadeInDown.duration(500)
              .delay(250)
              .easing(Easing.out(Easing.ease))}
            style={styles.subtext}
          >
            Choose the areas where you'd like cosmic guidance.{'\n'}
            You can always change these later.
          </Animated.Text>

          {/* ── Selection counter ── */}
          <SelectionCounter count={selectedAreas.size} />

          {/* ── Interest cards grid (2 columns) ── */}
          <View style={styles.grid}>
            {gridRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((area, colIndex) => (
                  <InterestCard
                    key={area.id}
                    area={area}
                    isSelected={selectedAreas.has(area.id)}
                    onToggle={handleToggle}
                    index={rowIndex * 2 + colIndex}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* ── Bottom spacer ── */}
          <View style={{ height: spacing.xxl + 20 }} />
        </ScrollView>

        {/* ── CTA Button: "Complete Your Profile ✨" (fixed at bottom) ── */}
        <Animated.View
          entering={FadeInUp.duration(500)
            .delay(700)
            .easing(Easing.out(Easing.ease))}
          style={styles.ctaContainer}
        >
          <AnimatedPressable
            onPress={handleComplete}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!hasSelection}
            style={[
              styles.ctaButton,
              buttonAnimatedStyle,
              buttonGlowStyle,
              buttonOpacityStyle,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Complete Your Profile"
            accessibilityState={{ disabled: !hasSelection }}
            accessibilityHint={
              hasSelection
                ? 'Completes your cosmic profile and enters the app'
                : 'Select at least one area of interest to continue'
            }
          >
            {/* Shimmer overlay (only when enabled) */}
            {hasSelection && <ShimmerOverlay />}

            <Text style={styles.ctaText}>Complete Your Profile</Text>
            <Text style={styles.ctaSparkle}>✨</Text>

            {/* Celebration burst (on press) */}
            <CelebrationBurst active={showCelebration} />
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
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    marginBottom: spacing.xs,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },

  headerSpacer: {
    width: 44,
  },

  // ── Progress Dots ──
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
  },

  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentGold,
    ...Platform.select({
      ios: {
        shadowColor: colors.accentGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },

  progressDotPast: {
    backgroundColor: colors.accentGold,
    opacity: 0.5,
  },

  // ── ScrollView ──
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // ── Headline ──
  headline: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display2,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.display2 * 1.25,
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(212, 165, 71, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
      android: {},
    }),
  },

  // ── Subtext ──
  subtext: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.sizes.bodySmall * 1.6,
    letterSpacing: 0.2,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },

  // ── Selection Counter ──
  counterContainer: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.accentGoldLight,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.2)',
  },

  counterText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.tiny,
    color: colors.accentGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Grid ──
  grid: {
    gap: GRID_GAP,
  },

  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },

  // ── Interest Card ──
  interestCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Checkmark (top-right) ──
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },

  // ── Card emoji ──
  cardEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
    lineHeight: 34,
  },

  // ── Card label ──
  cardLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.caption * 1.35,
    letterSpacing: 0.1,
  },

  // ── Accent dot (decorative) ──
  accentDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // ── CTA Container ──
  ctaContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },

  ctaButton: {
    backgroundColor: colors.accentGold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 58,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: colors.accentGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  ctaText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: colors.white,
    letterSpacing: 0.5,
  },

  ctaSparkle: {
    fontSize: 18,
    marginLeft: spacing.xs,
  },

  // ── Shimmer Overlay ──
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    zIndex: 1,
  },

  shimmerGradient: {
    flex: 1,
    width: 120,
  },

  // ── Celebration Burst ──
  celebrationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    zIndex: 10,
  },
});
