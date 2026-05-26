/**
 * VEYa — Screen 07: Personality Snapshot ✨
 *
 * Shows a brief AI-generated personality insight based on the user's chart.
 * This is a key trust-building and retention moment — making the user feel
 * truly "seen" by the app. The personality text is personal, specific, and
 * evocative — never generic horoscope filler.
 *
 * Content:
 *   - Progress indicator (7/8 dots, step index 6)
 *   - Headline: "A Glimpse Into You" (Playfair Display)
 *   - Personality card with 3 trait insights (Scorpio Sun, Pisces Moon, Leo Rising)
 *   - Each trait separated by gold hairline dividers
 *   - Resonance prompt: "Does this feel like you?" with two soft buttons
 *   - Continue button + Back arrow
 *
 * Animation Sequence:
 *   1. Header (back + progress) fades in (200ms delay)
 *   2. Headline fades in from below (400ms delay)
 *   3. Personality card slides up with a gentle spring (700ms delay)
 *   4. Trait rows appear staggered inside the card (900ms + 300ms stagger)
 *   5. Resonance prompt fades in (2000ms delay)
 *   6. Continue button fades in from below (2400ms delay)
 *   7. "Spot On" tap → sparkle burst celebration
 *   8. "Not Quite" tap → soft acknowledgment nod
 *
 * Visual Direction:
 *   - The personality card feels like reading a beautifully typeset letter
 *   - Inter Italic / light weight for personality descriptions
 *   - Generous line height (1.7×) for readability
 *   - Gold hairline dividers between traits
 *   - Subtle radial gradient watermark behind the card
 *   - Resonance buttons: playful but elegant pill shapes
 *   - Scrollable on smaller screens
 *
 * Mock Data: Scorpio Sun, Pisces Moon, Leo Rising
 *
 * Design direction: Luxury light theme · Cream background · Playfair + Inter ·
 * Warm gold accents · Typography-led, impeccable typesetting
 *
 * @module screens/onboarding/personality
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
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ScreenErrorBoundary } from '@/components/shared/ScreenErrorBoundary';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (identical to Screens 01–06)
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
  fire: '#E8664D',
  earth: '#6B8E6B',
  air: '#D4A547',
  water: '#5B8DB8',
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
    bodyItalic: 'Inter-Italic',       // Used for personality descriptions
    bodyLightItalic: 'Inter-LightItalic', // Fallback if available
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
const CURRENT_STEP = 6; // 0-indexed: step 6 of 8 (7th dot active)

// ─────────────────────────────────────────────────────────────
// PERSONALITY TRAIT DATA
// These represent AI-generated personality insights based on the
// user's Big Three. Written to feel personal, poetic, and specific —
// not generic sun-sign horoscope.
// ─────────────────────────────────────────────────────────────

interface PersonalityTrait {
  icon: string;
  title: string;
  source: string;       // e.g. "Scorpio Sun"
  description: string;
}

const PERSONALITY_TRAITS: PersonalityTrait[] = [
  {
    icon: '🔥',
    title: 'Your Intensity',
    source: 'Scorpio Sun',
    description:
      'You feel everything deeply. When you love, you love completely. When you\'re curious, you dive to the bottom. There\'s no shallow end in your emotional pool — and you wouldn\'t have it any other way.',
  },
  {
    icon: '🌊',
    title: 'Your Inner World',
    source: 'Pisces Moon',
    description:
      'Your emotional landscape is vast and fluid. You absorb the energy of those around you like a sponge — their joys lift you, their sorrows linger. This is your gift and your tenderness.',
  },
  {
    icon: '✨',
    title: 'Your Presence',
    source: 'Leo Rising',
    description:
      'You walk into a room and people notice. There\'s a warmth and confidence that draws others in — not because you demand attention, but because your light is simply hard to miss.',
  },
];

// ─────────────────────────────────────────────────────────────
// SPARKLE PARTICLE DATA (for "Spot On" celebration)
// ─────────────────────────────────────────────────────────────

interface SparkleConfig {
  x: number;
  y: number;
  size: number;
  angle: number;   // direction of travel in radians
  distance: number; // how far to travel
  delay: number;
  duration: number;
  color: string;
}

function generateSparkles(centerX: number, centerY: number, count: number): SparkleConfig[] {
  const sparkleColors = [
    colors.accentGold,
    'rgba(212, 165, 71, 0.8)',
    colors.cosmicPurple,
    'rgba(139, 92, 246, 0.6)',
    colors.accentRose,
    '#FFFFFF',
  ];

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    return {
      x: centerX,
      y: centerY,
      size: Math.random() * 4 + 2,
      angle,
      distance: Math.random() * 60 + 30,
      delay: Math.random() * 150,
      duration: Math.random() * 400 + 400,
      color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
    };
  });
}

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES (consistent with Screens 01–06)
// Slightly fewer than Screen 06 — this screen is text-focused,
// so background should be calmer.
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
    'rgba(212, 165, 71, 0.45)',
    'rgba(212, 165, 71, 0.3)',
    'rgba(139, 92, 246, 0.18)',
    'rgba(232, 120, 138, 0.12)',
    'rgba(212, 165, 71, 0.35)',
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH,
      cy: Math.random() * SCREEN_HEIGHT,
      r: Math.random() * 2 + 0.4,
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

const PARTICLES = generateParticles(10);

function StardustParticle({ config }: { config: ParticleConfig }) {
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
        -1, true
      )
    );
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftY, { duration: config.duration * 1.1, easing: Easing.inOut(Easing.sin) }),
          withTiming(-config.driftY * 0.6, { duration: config.duration * 0.9, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      )
    );
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.opacity, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) }),
          withTiming(config.opacity * 0.2, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) })
        ),
        -1, true
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
}

// ─────────────────────────────────────────────────────────────
// PROGRESS INDICATOR (identical to Screens 01–06)
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
      entering={FadeIn.duration(600).delay(200)}
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
// BACK BUTTON (identical to Screens 01–06)
// ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the chart reveal screen"
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
// SPARKLE BURST EFFECT
// Triggered when user taps "✨ Spot On". A burst of tiny particles
// radiates outward from the button center, fades, and disappears.
// ─────────────────────────────────────────────────────────────

function SparkleParticle({ config }: { config: SparkleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    const targetX = Math.cos(config.angle) * config.distance;
    const targetY = Math.sin(config.angle) * config.distance;

    translateX.value = withDelay(
      config.delay,
      withTiming(targetX, { duration: config.duration, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      config.delay,
      withTiming(targetY, { duration: config.duration, easing: Easing.out(Easing.cubic) })
    );
    scale.value = withDelay(
      config.delay,
      withSequence(
        withTiming(1, { duration: config.duration * 0.3, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: config.duration * 0.7, easing: Easing.in(Easing.ease) })
      )
    );
    opacity.value = withDelay(
      config.delay,
      withSequence(
        withTiming(1, { duration: config.duration * 0.2 }),
        withTiming(0, { duration: config.duration * 0.8, easing: Easing.in(Easing.ease) })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.x - config.size / 2,
          top: config.y - config.size / 2,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

function SparkleBurst({ visible, centerX, centerY }: { visible: boolean; centerX: number; centerY: number }) {
  const sparkles = useMemo(
    () => (visible ? generateSparkles(centerX, centerY, 16) : []),
    [visible, centerX, centerY]
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {sparkles.map((s, i) => (
        <SparkleParticle key={i} config={s} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PERSONALITY TRAIT ROW
// A single trait inside the personality card. Contains:
//   - Subtle icon/emoji
//   - Trait title (Inter SemiBold)
//   - Source label (e.g. "Scorpio Sun", tiny caps)
//   - Description (Inter Italic, generous line height)
// ─────────────────────────────────────────────────────────────

interface TraitRowProps {
  trait: PersonalityTrait;
  index: number;
  isLast: boolean;
}

function TraitRow({ trait, index, isLast }: TraitRowProps) {
  const delay = 900 + index * 300;

  return (
    <Animated.View
      entering={FadeInDown.duration(500)
        .delay(delay)
        .easing(Easing.out(Easing.cubic))}
    >
      <View style={styles.traitRow}>
        {/* Icon */}
        <Text style={styles.traitIcon}>{trait.icon}</Text>

        {/* Content */}
        <View style={styles.traitContent}>
          {/* Title + Source */}
          <View style={styles.traitHeader}>
            <Text style={styles.traitTitle}>{trait.title}</Text>
            <Text style={styles.traitSource}>{trait.source}</Text>
          </View>

          {/* Description — the soul of the card */}
          <Text style={styles.traitDescription}>{trait.description}</Text>
        </View>
      </View>

      {/* Gold hairline divider (not on last item) */}
      {!isLast && (
        <View style={styles.traitDivider}>
          <LinearGradient
            colors={['transparent', colors.accentGoldDim, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.traitDividerGradient}
          />
        </View>
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// PERSONALITY CARD
// The main content container. Styled like a beautifully typeset
// letter: white/cream card with subtle shadow, radial gradient
// watermark behind, and impeccable typography.
// ─────────────────────────────────────────────────────────────

function PersonalityCard() {
  return (
    <Animated.View
      entering={FadeInUp.duration(600)
        .delay(700)
        .easing(Easing.out(Easing.cubic))}
      style={styles.personalityCard}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FEFDFB', '#FBF8F2']}
        locations={[0, 0.5, 1]}
        style={styles.cardGradient}
      >
        {/* Subtle decorative watermark — faint star/compass behind text */}
        <View style={styles.cardWatermark} pointerEvents="none">
          <Svg width={120} height={120} viewBox="0 0 120 120" opacity={0.04}>
            <G>
              {/* Simple 8-point star watermark */}
              <Line x1="60" y1="10" x2="60" y2="110" stroke={colors.accentGold} strokeWidth={1.5} />
              <Line x1="10" y1="60" x2="110" y2="60" stroke={colors.accentGold} strokeWidth={1.5} />
              <Line x1="25" y1="25" x2="95" y2="95" stroke={colors.accentGold} strokeWidth={1} />
              <Line x1="95" y1="25" x2="25" y2="95" stroke={colors.accentGold} strokeWidth={1} />
              <Circle cx="60" cy="60" r="35" stroke={colors.accentGold} strokeWidth={0.8} fill="none" />
              <Circle cx="60" cy="60" r="50" stroke={colors.accentGold} strokeWidth={0.4} fill="none" />
            </G>
          </Svg>
        </View>

        {/* Top decorative line */}
        <View style={styles.cardTopAccent}>
          <LinearGradient
            colors={['transparent', colors.accentGold, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardTopAccentLine}
          />
        </View>

        {/* Trait rows */}
        <View style={styles.traitsContainer}>
          {PERSONALITY_TRAITS.map((trait, index) => (
            <TraitRow
              key={trait.title}
              trait={trait}
              index={index}
              isLast={index === PERSONALITY_TRAITS.length - 1}
            />
          ))}
        </View>

        {/* Bottom decorative line */}
        <View style={styles.cardBottomAccent}>
          <LinearGradient
            colors={['transparent', colors.accentGold, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardBottomAccentLine}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// RESONANCE PROMPT
// "Does this feel like you?" with two soft pill buttons.
// "✨ Spot On" → sparkle celebration + gentle haptic
// "Hmm, Not Quite" → soft nod acknowledgment
// Both set a flag and are non-blocking.
// ─────────────────────────────────────────────────────────────

interface ResonancePromptProps {
  onResponse: (response: 'spot_on' | 'not_quite') => void;
  selectedResponse: 'spot_on' | 'not_quite' | null;
  sparkleVisible: boolean;
  sparkleCenterX: number;
  sparkleCenterY: number;
}

function ResonancePrompt({
  onResponse,
  selectedResponse,
  sparkleVisible,
  sparkleCenterX,
  sparkleCenterY,
}: ResonancePromptProps) {
  const spotOnScale = useSharedValue(1);
  const notQuiteScale = useSharedValue(1);

  // Animated glow when selected
  const spotOnGlow = useSharedValue(0);
  const notQuiteGlow = useSharedValue(0);

  useEffect(() => {
    if (selectedResponse === 'spot_on') {
      spotOnGlow.value = withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 500, easing: Easing.inOut(Easing.ease) })
      );
    } else if (selectedResponse === 'not_quite') {
      notQuiteGlow.value = withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 500, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [selectedResponse]);

  const spotOnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: spotOnScale.value }],
    backgroundColor:
      selectedResponse === 'spot_on'
        ? `rgba(212, 165, 71, ${interpolate(spotOnGlow.value, [0, 1], [0.12, 0.2])})`
        : 'rgba(212, 165, 71, 0.08)',
    borderColor:
      selectedResponse === 'spot_on'
        ? colors.accentGold
        : 'rgba(212, 165, 71, 0.2)',
  }));

  const notQuiteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notQuiteScale.value }],
    backgroundColor:
      selectedResponse === 'not_quite'
        ? `rgba(107, 107, 128, ${interpolate(notQuiteGlow.value, [0, 1], [0.08, 0.14])})`
        : 'rgba(107, 107, 128, 0.05)',
    borderColor:
      selectedResponse === 'not_quite'
        ? colors.textMuted
        : 'rgba(107, 107, 128, 0.15)',
  }));

  const handleSpotOn = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    spotOnScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onResponse('spot_on');
  };

  const handleNotQuite = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    notQuiteScale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    onResponse('not_quite');
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(500)
        .delay(2000)
        .easing(Easing.out(Easing.cubic))}
      style={styles.resonanceContainer}
    >
      {/* Prompt question */}
      <Text style={styles.resonanceQuestion}>Does this feel like you?</Text>

      {/* Response buttons */}
      <View style={styles.resonanceButtons}>
        {/* ✨ Spot On */}
        <Animated.View style={[styles.resonanceButton, spotOnAnimatedStyle]}>
          <Pressable
            onPress={handleSpotOn}
            style={styles.resonanceButtonInner}
            accessibilityRole="button"
            accessibilityLabel="Spot On"
            accessibilityHint="Confirms the personality reading resonates with you"
            accessibilityState={{ selected: selectedResponse === 'spot_on' }}
          >
            <Text style={[
              styles.resonanceButtonText,
              selectedResponse === 'spot_on' && styles.resonanceButtonTextSelected,
            ]}>
              ✨ Spot On
            </Text>
          </Pressable>
        </Animated.View>

        {/* Hmm, Not Quite */}
        <Animated.View style={[styles.resonanceButton, notQuiteAnimatedStyle]}>
          <Pressable
            onPress={handleNotQuite}
            style={styles.resonanceButtonInner}
            accessibilityRole="button"
            accessibilityLabel="Hmm, Not Quite"
            accessibilityHint="Indicates the personality reading doesn't fully resonate"
            accessibilityState={{ selected: selectedResponse === 'not_quite' }}
          >
            <Text style={[
              styles.resonanceButtonText,
              styles.resonanceButtonTextMuted,
              selectedResponse === 'not_quite' && styles.resonanceButtonTextNotQuiteSelected,
            ]}>
              Hmm, Not Quite
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Soft acknowledgment text after selection */}
      {selectedResponse === 'spot_on' && (
        <Animated.Text
          entering={FadeIn.duration(400).easing(Easing.out(Easing.ease))}
          style={styles.resonanceAcknowledgment}
        >
          We thought so ✨
        </Animated.Text>
      )}
      {selectedResponse === 'not_quite' && (
        <Animated.Text
          entering={FadeIn.duration(400).easing(Easing.out(Easing.ease))}
          style={styles.resonanceAcknowledgment}
        >
          No worries — the stars reveal more over time
        </Animated.Text>
      )}

      {/* Sparkle burst overlay */}
      <SparkleBurst
        visible={sparkleVisible}
        centerX={sparkleCenterX}
        centerY={sparkleCenterY}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// ANIMATED CTA PRESSABLE
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: PersonalitySnapshotScreen
// ─────────────────────────────────────────────────────────────

function PersonalitySnapshotScreenInner() {
  const insets = useSafeAreaInsets();
  const { data, completeOnboarding } = useOnboardingStore();
  const userName = data?.name || 'You';

  // ── State ──
  const [resonanceResponse, setResonanceResponse] = useState<'spot_on' | 'not_quite' | null>(null);
  const [sparkleVisible, setSparkleVisible] = useState(false);

  // Sparkle position (center of screen horizontally, roughly where the button is)
  const sparkleCenterX = SCREEN_WIDTH / 2 - 40;
  const sparkleCenterY = 20;

  // ── CTA button animation ──
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);

  useEffect(() => {
    // Subtle continuous glow on the CTA after it appears
    buttonGlow.value = withDelay(
      2800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  // ── Handlers ──
  const handleBack = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleContinue = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Save resonance response to onboarding store (for analytics)
    // useOnboardingStore.getState().setPersonalityResonance(resonanceResponse);
    router.push('/(auth)/onboarding/methodology');
  };

  const handleResonanceResponse = useCallback((response: 'spot_on' | 'not_quite') => {
    setResonanceResponse(response);
    if (response === 'spot_on') {
      setSparkleVisible(true);
      // Clean up sparkles after animation
      setTimeout(() => setSparkleVisible(false), 1000);
    }
  }, []);

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.95, { duration: 100, easing: Easing.out(Easing.ease) });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(buttonGlow.value, [0, 1], [0.3, 0.5]),
    shadowRadius: interpolate(buttonGlow.value, [0, 1], [12, 18]),
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={['#FDFBF7', '#FAF6EE', '#F5F0E8']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Stardust particles (subdued) ── */}
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
          entering={FadeIn.duration(500).delay(100)}
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
          {/* ── Headline: "A Glimpse Into You" ── */}
          <Animated.Text
            entering={FadeInDown.duration(600)
              .delay(400)
              .easing(Easing.out(Easing.ease))}
            style={styles.headline}
            accessibilityRole="header"
          >
            A Glimpse Into You
          </Animated.Text>

          {/* ── Subtitle ── */}
          <Animated.Text
            entering={FadeInDown.duration(500)
              .delay(600)
              .easing(Easing.out(Easing.ease))}
            style={styles.subtitle}
          >
            Based on your unique cosmic blueprint
          </Animated.Text>

          {/* ── Personality Card ── */}
          <PersonalityCard />

          {/* ── Resonance Prompt ── */}
          <ResonancePrompt
            onResponse={handleResonanceResponse}
            selectedResponse={resonanceResponse}
            sparkleVisible={sparkleVisible}
            sparkleCenterX={sparkleCenterX}
            sparkleCenterY={sparkleCenterY}
          />

          {/* ── Bottom spacer ── */}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* ── CTA Button: "Continue" (fixed at bottom) ── */}
        <Animated.View
          entering={FadeInUp.duration(400)
            .delay(800)
            .easing(Easing.out(Easing.ease))}
          style={styles.ctaContainer}
        >
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.ctaButton, buttonAnimatedStyle, buttonGlowStyle]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityHint="Proceeds to choose your focus areas"
          >
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  // ── Headline ──
  headline: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display2,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.display2 * 1.2,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(212, 165, 71, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
      android: {},
    }),
  },

  subtitle: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: spacing.xl,
  },

  // ── Personality Card ──
  personalityCard: {
    marginHorizontal: -spacing.xs,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(26, 26, 46, 0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: { elevation: 4 },
    }),
  },

  cardGradient: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.12)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },

  cardWatermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -60,
    marginLeft: -60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardTopAccent: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  cardTopAccentLine: {
    width: 60,
    height: 1,
  },

  cardBottomAccent: {
    alignItems: 'center',
    marginTop: spacing.md,
  },

  cardBottomAccentLine: {
    width: 60,
    height: 1,
  },

  traitsContainer: {
    // Container for the trait rows
  },

  // ── Trait Row ──
  traitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },

  traitIcon: {
    fontSize: 22,
    marginRight: spacing.md,
    marginTop: 2,
    lineHeight: 28,
  },

  traitContent: {
    flex: 1,
  },

  traitHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  traitTitle: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  traitSource: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  traitDescription: {
    fontFamily: typography.fonts.displayItalic, // Playfair Display Italic for elegance
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * 1.7,
    letterSpacing: 0.15,
  },

  traitDivider: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  traitDividerGradient: {
    width: '80%',
    height: StyleSheet.hairlineWidth,
  },

  // ── Resonance Prompt ──
  resonanceContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },

  resonanceQuestion: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },

  resonanceButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  resonanceButton: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    overflow: 'hidden',
  },

  resonanceButtonInner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resonanceButtonText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.accentGold,
    letterSpacing: 0.3,
  },

  resonanceButtonTextSelected: {
    color: colors.accentGold,
    fontFamily: typography.fonts.bodySemiBold,
  },

  resonanceButtonTextMuted: {
    color: colors.textMuted,
  },

  resonanceButtonTextNotQuiteSelected: {
    color: colors.textSecondary,
    fontFamily: typography.fonts.bodySemiBold,
  },

  resonanceAcknowledgment: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.3,
  },

  // ── CTA ──
  ctaContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },

  ctaButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },

  ctaText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  ctaArrow: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default function PersonalitySnapshotScreen() {
  return (
    <ScreenErrorBoundary screenName="Personality">
      <PersonalitySnapshotScreenInner />
    </ScreenErrorBoundary>
  );
}
