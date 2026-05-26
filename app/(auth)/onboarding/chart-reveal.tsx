/**
 * VEYa — Screen 06: Chart Reveal ⭐ (THE WOW MOMENT)
 *
 * This is the most important screen in the entire onboarding experience.
 * The user sees their natal chart for the first time. It must feel magical,
 * personal, and awe-inspiring — the moment they fall in love with the app.
 *
 * Animation Sequence (~6 seconds total):
 *   1. Screen fades in with headline (0.6s)
 *   2. Chart outer ring draws itself via stroke animation (1.5s)
 *   3. House division lines appear staggered (0.5s)
 *   4. Zodiac symbols fade in around the ring staggered (1.0s)
 *   5. Planet dots fly in to positions with glow trail (1.5s)
 *   6. Brief golden pulse/glow on the whole chart (0.5s)
 *   7. Key highlights (Sun, Moon, Rising) slide up one by one (0.8s)
 *   8. CTA button fades in (0.4s)
 *   → After completion: subtle breathing scale pulse on the chart
 *
 * Visual Direction:
 *   - Premium hand-crafted astronomical illustration style
 *   - Thin, elegant SVG lines — never thick or clunky
 *   - Gold (#D4A547) and cosmic purple (#8B5CF6) accents
 *   - Planet dots with subtle glow/aura
 *   - Radial gradient emanating from chart center
 *   - Very faint constellation lines in background
 *   - More visual richness than any other screen — this is the payoff
 *
 * Mock Data: Scorpio Sun, Pisces Moon, Leo Rising
 *
 * Design direction: Luxury light theme · Cream background · Playfair + Inter ·
 * Warm gold accents · The screen users screenshot and share
 *
 * @module screens/onboarding/chart-reveal
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
  useAnimatedProps,
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
  FadeOut,
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
  Text as SvgText,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (identical to Screens 01–05)
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
  chartLine: 'rgba(212, 165, 71, 0.45)',
  chartLineFaint: 'rgba(212, 165, 71, 0.18)',
  planetGlow: 'rgba(212, 165, 71, 0.35)',
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
const CURRENT_STEP = 5; // 0-indexed: step 5 of 8 (6th dot active)

// Chart dimensions — sized to be the hero centerpiece
const CHART_SIZE = Math.min(SCREEN_WIDTH - 48, 340);
const CHART_CENTER = CHART_SIZE / 2;
const OUTER_RADIUS = CHART_SIZE / 2 - 8;
const ZODIAC_RING_OUTER = OUTER_RADIUS;
const ZODIAC_RING_INNER = OUTER_RADIUS - 28;
const HOUSE_RING_OUTER = ZODIAC_RING_INNER;
const HOUSE_RING_INNER = OUTER_RADIUS * 0.28;

// ─────────────────────────────────────────────────────────────
// ANIMATION TIMING CONSTANTS
// These define the choreographed sequence that makes the reveal magical.
// Total: ~6.2 seconds from screen mount to CTA appearance.
// ─────────────────────────────────────────────────────────────

const TIMING = {
  // Phase 0: Screen fade-in + headline
  headlineFadeIn: 600,       // ms

  // Phase 1: Outer ring stroke draw
  ringDrawDelay: 400,        // after headline
  ringDrawDuration: 1500,

  // Phase 2: House division lines
  houseLineDelay: 1800,      // after ring starts
  houseLineDuration: 500,
  houseLineStagger: 40,      // between each of 12 lines

  // Phase 3: Zodiac symbols
  zodiacDelay: 2400,
  zodiacDuration: 800,
  zodiacStagger: 70,

  // Phase 4: Planet dots fly in
  planetDelay: 3400,
  planetDuration: 600,
  planetStagger: 180,

  // Phase 5: Golden pulse/glow
  glowPulseDelay: 5000,
  glowPulseDuration: 600,

  // Phase 6: Key highlights slide up
  highlightDelay: 5400,
  highlightDuration: 500,
  highlightStagger: 250,

  // Phase 7: CTA button
  ctaDelay: 6400,
  ctaDuration: 500,

  // Phase 8: Breathing (post-animation, continuous)
  breatheDelay: 6500,
  breatheDuration: 4000,
} as const;

// ─────────────────────────────────────────────────────────────
// ZODIAC DATA
// 12 signs with their Unicode symbols, positioned around the wheel.
// Starting from Aries at 0° (3 o'clock position in standard astro).
// ─────────────────────────────────────────────────────────────

interface ZodiacSign {
  name: string;
  symbol: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  startDegree: number;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: 'Aries',       symbol: '♈', element: 'fire',  startDegree: 0 },
  { name: 'Taurus',      symbol: '♉', element: 'earth', startDegree: 30 },
  { name: 'Gemini',      symbol: '♊', element: 'air',   startDegree: 60 },
  { name: 'Cancer',      symbol: '♋', element: 'water', startDegree: 90 },
  { name: 'Leo',         symbol: '♌', element: 'fire',  startDegree: 120 },
  { name: 'Virgo',       symbol: '♍', element: 'earth', startDegree: 150 },
  { name: 'Libra',       symbol: '♎', element: 'air',   startDegree: 180 },
  { name: 'Scorpio',     symbol: '♏', element: 'water', startDegree: 210 },
  { name: 'Sagittarius', symbol: '♐', element: 'fire',  startDegree: 240 },
  { name: 'Capricorn',   symbol: '♑', element: 'earth', startDegree: 270 },
  { name: 'Aquarius',    symbol: '♒', element: 'air',   startDegree: 300 },
  { name: 'Pisces',      symbol: '♓', element: 'water', startDegree: 330 },
];

const ELEMENT_COLORS: Record<string, string> = {
  fire: colors.fire,
  earth: colors.earth,
  air: colors.air,
  water: colors.water,
};

// ─────────────────────────────────────────────────────────────
// PLANET DATA (Mock — Scorpio Sun, Pisces Moon, Leo Rising)
// Degrees are absolute zodiac positions (0–360).
// ─────────────────────────────────────────────────────────────

interface Planet {
  name: string;
  symbol: string;
  degree: number;      // absolute zodiac degree
  color: string;
  glowColor: string;
  size: number;        // radius of the dot
}

const PLANETS: Planet[] = [
  { name: 'Sun',     symbol: '☉', degree: 225, color: '#D4A547', glowColor: 'rgba(212, 165, 71, 0.5)',  size: 6 },
  { name: 'Moon',    symbol: '☽', degree: 345, color: '#C4B5E0', glowColor: 'rgba(196, 181, 224, 0.5)', size: 5.5 },
  { name: 'Mercury', symbol: '☿', degree: 235, color: '#A8947A', glowColor: 'rgba(168, 148, 122, 0.4)', size: 3.5 },
  { name: 'Venus',   symbol: '♀', degree: 190, color: '#E8788A', glowColor: 'rgba(232, 120, 138, 0.45)', size: 4.5 },
  { name: 'Mars',    symbol: '♂', degree: 155, color: '#E8664D', glowColor: 'rgba(232, 102, 77, 0.45)',  size: 4 },
  { name: 'Jupiter', symbol: '♃', degree: 40,  color: '#8B5CF6', glowColor: 'rgba(139, 92, 246, 0.4)',  size: 5 },
  { name: 'Saturn',  symbol: '♄', degree: 285, color: '#6B8E6B', glowColor: 'rgba(107, 142, 107, 0.4)', size: 4.5 },
  { name: 'Uranus',  symbol: '♅', degree: 70,  color: '#5B8DB8', glowColor: 'rgba(91, 141, 184, 0.4)',  size: 3.5 },
  { name: 'Neptune', symbol: '♆', degree: 355, color: '#7B9FCC', glowColor: 'rgba(123, 159, 204, 0.45)', size: 3.5 },
  { name: 'Pluto',   symbol: '⯓', degree: 300, color: '#9B7A5A', glowColor: 'rgba(155, 122, 90, 0.35)', size: 3 },
];

// ─────────────────────────────────────────────────────────────
// ASCENDANT (Rising Sign) position — Leo Rising = ~120°
// This determines the rotation of the house system overlay.
// ─────────────────────────────────────────────────────────────

const ASCENDANT_DEGREE = 120; // Leo Rising

// House cusps — Placidus-style mock data (unequal houses)
// Each value is the zodiac degree of the house cusp.
const HOUSE_CUSPS = [120, 148, 178, 210, 242, 268, 300, 328, 358, 30, 62, 88];

// ─────────────────────────────────────────────────────────────
// KEY HIGHLIGHTS (Big Three) — shown below the chart
// ─────────────────────────────────────────────────────────────

interface BigThreeHighlight {
  icon: string;
  label: string;
  sign: string;
  archetype: string;
  description: string;
  accentColor: string;
}

const BIG_THREE: BigThreeHighlight[] = [
  {
    icon: '☉',
    label: 'Sun Sign',
    sign: 'Scorpio',
    archetype: 'The Transformer',
    description: 'Your core essence — intense, perceptive, and magnetic. You feel everything at full depth.',
    accentColor: colors.water,
  },
  {
    icon: '☽',
    label: 'Moon Sign',
    sign: 'Pisces',
    archetype: 'The Dreamer',
    description: 'Your emotional world — intuitive, empathetic, and beautifully imaginative.',
    accentColor: colors.water,
  },
  {
    icon: '↑',
    label: 'Rising Sign',
    sign: 'Leo',
    archetype: 'The Performer',
    description: 'How the world sees you — radiant, confident, and impossibly warm.',
    accentColor: colors.fire,
  },
];

// ─────────────────────────────────────────────────────────────
// UTILITY: Polar → Cartesian conversion
// Astro convention: 0° = left (Aries/Ascendant), counter-clockwise
// SVG convention: 0° = right, clockwise
// We convert astro degrees to SVG angles.
// ─────────────────────────────────────────────────────────────

function astroToSvgAngle(astroDegree: number): number {
  // Astro: 0° Aries at 9 o'clock, counter-clockwise
  // We'll place 0° Aries at the left (9 o'clock) and go counter-clockwise
  // SVG angle: measured clockwise from 3 o'clock (right)
  // SVG angle = 180 - astroDegree (for counter-clockwise)
  return (180 - astroDegree) * (Math.PI / 180);
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  astroDegree: number
): { x: number; y: number } {
  const angle = astroToSvgAngle(astroDegree);
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY - radius * Math.sin(angle),
  };
}

/**
 * Generates an SVG arc path from startDegree to endDegree at given radius.
 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number
): string {
  const start = polarToCartesian(cx, cy, radius, startDeg);
  const end = polarToCartesian(cx, cy, radius, endDeg);
  // Determine if the arc is > 180 degrees
  const diff = ((endDeg - startDeg + 360) % 360);
  const largeArcFlag = diff > 180 ? 1 : 0;
  // Counter-clockwise in astro = clockwise in SVG sweep
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// ─────────────────────────────────────────────────────────────
// ANIMATED SVG COMPONENTS
// ─────────────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IS_WEB = Platform.OS === 'web';

// ─────────────────────────────────────────────────────────────
// BACKGROUND: Constellation Lines + Radial Glow
// Very faint, atmospheric background that adds depth without
// competing with the chart. Subtle enough to be felt, not seen.
// ─────────────────────────────────────────────────────────────

function BackgroundConstellation() {
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withDelay(
      200,
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value * 0.4,
  }));

  // Constellation star positions (scattered across the background)
  const stars = [
    { x: 45, y: 120, r: 1.2 }, { x: 80, y: 60, r: 0.8 },
    { x: 160, y: 40, r: 1.0 }, { x: 280, y: 70, r: 1.3 },
    { x: 320, y: 130, r: 0.9 }, { x: 350, y: 50, r: 1.1 },
    { x: 30, y: 200, r: 0.7 }, { x: 370, y: 180, r: 0.8 },
    { x: 200, y: 30, r: 1.0 }, { x: 100, y: 160, r: 0.6 },
    { x: 300, y: 160, r: 0.7 }, { x: 55, y: 280, r: 0.9 },
    { x: 340, y: 260, r: 1.0 }, { x: 190, y: 290, r: 0.8 },
  ];

  // Connecting lines between some stars
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], [5, 4],
    [6, 0], [7, 4], [8, 2], [9, 6], [10, 7],
    [11, 6], [12, 7], [13, 11],
  ];

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, animatedStyle]}
      pointerEvents="none"
    >
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.5} viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.5}`}>
        {/* Constellation connecting lines */}
        {connections.map(([a, b], i) => (
          <Line
            key={`bg-line-${i}`}
            x1={stars[a].x}
            y1={stars[a].y}
            x2={stars[b].x}
            y2={stars[b].y}
            stroke={colors.accentGold}
            strokeWidth={0.4}
            strokeOpacity={0.25}
          />
        ))}

        {/* Star dots */}
        {stars.map((star, i) => (
          <G key={`bg-star-${i}`}>
            <Circle
              cx={star.x} cy={star.y} r={star.r * 3}
              fill={colors.accentGold} opacity={0.06}
            />
            <Circle
              cx={star.x} cy={star.y} r={star.r}
              fill={colors.accentGold} opacity={0.3}
            />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES (consistent with Screens 01–05)
// Slightly more particles and more gold for this special screen.
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
    'rgba(212, 165, 71, 0.5)',
    'rgba(212, 165, 71, 0.35)',
    'rgba(139, 92, 246, 0.2)',
    'rgba(232, 120, 138, 0.15)',
    'rgba(212, 165, 71, 0.45)',
    'rgba(196, 181, 224, 0.25)', // Lunar purple for this screen
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH,
      cy: Math.random() * SCREEN_HEIGHT,
      r: Math.random() * 2.2 + 0.5,
      opacity: Math.random() * 0.45 + 0.1,
      delay: Math.random() * 5000,
      duration: Math.random() * 7000 + 5000,
      driftX: (Math.random() - 0.5) * 25,
      driftY: (Math.random() - 0.5) * 30,
      color: tones[Math.floor(Math.random() * tones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(20);

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
// PROGRESS INDICATOR (identical to Screens 01–05)
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
// BACK BUTTON (identical to Screens 01–05)
// ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the birth place screen"
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
// NATAL CHART WHEEL (SVG — the star of the show)
//
// Structure (outside → inside):
//   1. Outer ring — thin gold circle, stroke-animated
//   2. Zodiac band — 12 segments with zodiac symbols
//   3. Inner ring — boundary between zodiac band and houses
//   4. House divisions — 12 lines from inner ring to center
//   5. Planet dots — positioned at correct zodiac degrees
//   6. Central point — small decorative element
//
// The whole chart has a radial glow behind it and subtle
// decorative tick marks at each zodiac boundary.
// ─────────────────────────────────────────────────────────────

function NatalChartWheel() {
  // ── Animation shared values ──

  // Phase 1: Outer ring stroke
  const ringProgress = useSharedValue(IS_WEB ? 1 : 0);
  // Phase 2: House lines opacity (per line)
  const houseLinesOpacity = Array.from({ length: 12 }, () => useSharedValue(IS_WEB ? 1 : 0));
  // Phase 3: Zodiac symbols opacity (per symbol)
  const zodiacOpacity = Array.from({ length: 12 }, () => useSharedValue(IS_WEB ? 1 : 0));
  // Phase 4: Planet positions (each starts from center, flies out)
  const planetProgress = PLANETS.map(() => useSharedValue(IS_WEB ? 1 : 0));
  const planetOpacity = PLANETS.map(() => useSharedValue(IS_WEB ? 1 : 0));
  // Phase 5: Golden glow pulse
  const glowPulse = useSharedValue(IS_WEB ? 0.2 : 0);
  // Phase 6: Breathing (post-animation)
  const breatheScale = useSharedValue(1);

  // ── Kick off the animation sequence ──
  useEffect(() => {
    // Skip animations on web - show static chart immediately
    if (IS_WEB) return;
    
    // Phase 1: Draw outer ring (stroke-dashoffset animation)
    ringProgress.value = withDelay(
      TIMING.ringDrawDelay,
      withTiming(1, {
        duration: TIMING.ringDrawDuration,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Phase 2: House lines appear staggered
    houseLinesOpacity.forEach((val, i) => {
      val.value = withDelay(
        TIMING.houseLineDelay + i * TIMING.houseLineStagger,
        withTiming(1, {
          duration: TIMING.houseLineDuration,
          easing: Easing.out(Easing.ease),
        })
      );
    });

    // Phase 3: Zodiac symbols fade in staggered
    zodiacOpacity.forEach((val, i) => {
      val.value = withDelay(
        TIMING.zodiacDelay + i * TIMING.zodiacStagger,
        withTiming(1, {
          duration: TIMING.zodiacDuration,
          easing: Easing.out(Easing.ease),
        })
      );
    });

    // Phase 4: Planets fly in from center
    planetProgress.forEach((val, i) => {
      val.value = withDelay(
        TIMING.planetDelay + i * TIMING.planetStagger,
        withSpring(1, {
          damping: 12,
          stiffness: 80,
          mass: 0.8,
        })
      );
      planetOpacity[i].value = withDelay(
        TIMING.planetDelay + i * TIMING.planetStagger,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
      );
    });

    // Phase 5: Golden glow pulse
    glowPulse.value = withDelay(
      TIMING.glowPulseDelay,
      withSequence(
        withTiming(1, { duration: TIMING.glowPulseDuration / 2, easing: Easing.out(Easing.ease) }),
        withTiming(0.2, { duration: TIMING.glowPulseDuration / 2, easing: Easing.in(Easing.ease) })
      )
    );

    // Phase 6: Continuous breathing after all animations
    breatheScale.value = withDelay(
      TIMING.breatheDelay,
      withRepeat(
        withSequence(
          withTiming(1.015, {
            duration: TIMING.breatheDuration / 2,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(1, {
            duration: TIMING.breatheDuration / 2,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );
  }, []);

  // ── Animated props for the outer ring ──
  const outerRingCircumference = 2 * Math.PI * OUTER_RADIUS;

  // Always call hooks (React rules), but only use result on native
  const outerRingAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: outerRingCircumference * (1 - ringProgress.value),
  }));

  const innerRingAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 2 * Math.PI * ZODIAC_RING_INNER * (1 - ringProgress.value),
  }));

  const centerRingAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 2 * Math.PI * HOUSE_RING_INNER * (1 - ringProgress.value),
  }));

  const ascLabelAnimatedProps = useAnimatedProps(() => ({
    opacity: houseLinesOpacity[0].value * 0.7,
  }));
  const mcLabelAnimatedProps = useAnimatedProps(() => ({
    opacity: houseLinesOpacity[9].value * 0.5,
  }));

  // ── Animated style for the whole chart (breathing + glow) ──
  const chartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0, 0.6]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.08]) }],
  }));

  // ── Render helper: Zodiac segment tick marks ──
  const renderZodiacTicks = () => {
    return ZODIAC_SIGNS.map((sign, i) => {
      const degree = sign.startDegree;
      const outerPoint = polarToCartesian(CHART_CENTER, CHART_CENTER, ZODIAC_RING_OUTER, degree);
      const innerPoint = polarToCartesian(CHART_CENTER, CHART_CENTER, ZODIAC_RING_INNER, degree);
      return (
        <AnimatedLine
          key={`tick-${i}`}
          x1={outerPoint.x}
          y1={outerPoint.y}
          x2={innerPoint.x}
          y2={innerPoint.y}
          stroke={colors.accentGold}
          strokeWidth={0.8}
          strokeOpacity={zodiacOpacity[i].value}
        />
      );
    });
  };

  // ── Render helper: Zodiac symbol labels ──
  const renderZodiacSymbols = () => {
    return ZODIAC_SIGNS.map((sign, i) => {
      const midDegree = sign.startDegree + 15;
      const labelRadius = (ZODIAC_RING_OUTER + ZODIAC_RING_INNER) / 2;
      const pos = polarToCartesian(CHART_CENTER, CHART_CENTER, labelRadius, midDegree);
      const elementColor = ELEMENT_COLORS[sign.element];

      // On web, use static SvgText; on native, use AnimatedSvgText with animatedProps
      if (IS_WEB) {
        return (
          <SvgText
            key={`zodiac-${i}`}
            x={pos.x}
            y={pos.y + 5}
            textAnchor="middle"
            fontSize={12}
            fill={elementColor}
            fontWeight="400"
            opacity={1}
          >
            {sign.symbol}
          </SvgText>
        );
      }

      const animatedProps = useAnimatedProps(() => ({
        opacity: zodiacOpacity[i].value,
      }));

      return (
        <AnimatedSvgText
          key={`zodiac-${i}`}
          x={pos.x}
          y={pos.y + 5} // Vertical centering adjustment
          textAnchor="middle"
          fontSize={12}
          fill={elementColor}
          fontWeight="400"
          animatedProps={animatedProps}
        >
          {sign.symbol}
        </AnimatedSvgText>
      );
    });
  };

  // ── Render helper: House division lines ──
  const renderHouseLines = () => {
    return HOUSE_CUSPS.map((cuspDegree, i) => {
      const outerPoint = polarToCartesian(CHART_CENTER, CHART_CENTER, HOUSE_RING_OUTER, cuspDegree);
      const innerPoint = polarToCartesian(CHART_CENTER, CHART_CENTER, HOUSE_RING_INNER, cuspDegree);

      // Ascendant (house 1) and MC (house 10) lines are slightly thicker
      const isCardinal = i === 0 || i === 3 || i === 6 || i === 9;
      const strokeWidth = isCardinal ? 1.0 : 0.5;
      const strokeColor = isCardinal ? colors.accentGold : colors.chartLine;

      // On web, use static Line; on native, use AnimatedLine with animatedProps
      if (IS_WEB) {
        return (
          <Line
            key={`house-${i}`}
            x1={outerPoint.x}
            y1={outerPoint.y}
            x2={innerPoint.x}
            y2={innerPoint.y}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={1}
          />
        );
      }

      const animatedProps = useAnimatedProps(() => ({
        opacity: houseLinesOpacity[i].value,
      }));

      return (
        <AnimatedLine
          key={`house-${i}`}
          x1={outerPoint.x}
          y1={outerPoint.y}
          x2={innerPoint.x}
          y2={innerPoint.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          animatedProps={animatedProps}
        />
      );
    });
  };

  // ── Render helper: House number labels ──
  const renderHouseNumbers = () => {
    return HOUSE_CUSPS.map((cuspDegree, i) => {
      const nextCusp = HOUSE_CUSPS[(i + 1) % 12];
      const midDegree = cuspDegree + (((nextCusp - cuspDegree + 360) % 360) / 2);
      const labelRadius = (HOUSE_RING_OUTER + HOUSE_RING_INNER) / 2;
      const pos = polarToCartesian(CHART_CENTER, CHART_CENTER, labelRadius, midDegree);

      // On web, use static SvgText; on native, use AnimatedSvgText with animatedProps
      if (IS_WEB) {
        return (
          <SvgText
            key={`house-num-${i}`}
            x={pos.x}
            y={pos.y + 3.5}
            textAnchor="middle"
            fontSize={8}
            fill={colors.textMuted}
            fontWeight="400"
            opacity={0.35}
          >
            {i + 1}
          </SvgText>
        );
      }

      const animatedProps = useAnimatedProps(() => ({
        opacity: houseLinesOpacity[i].value * 0.35,
      }));

      return (
        <AnimatedSvgText
          key={`house-num-${i}`}
          x={pos.x}
          y={pos.y + 3.5}
          textAnchor="middle"
          fontSize={8}
          fill={colors.textMuted}
          fontWeight="400"
          animatedProps={animatedProps}
        >
          {i + 1}
        </AnimatedSvgText>
      );
    });
  };

  // ── Render helper: Planet dots with glow ──
  const renderPlanets = () => {
    // Place planets between inner ring and zodiac ring
    const planetRadius = (HOUSE_RING_OUTER + HOUSE_RING_INNER) / 2 + 12;

    return PLANETS.map((planet, i) => {
      const targetPos = polarToCartesian(CHART_CENTER, CHART_CENTER, planetRadius, planet.degree);

      const animatedStyle = useAnimatedStyle(() => {
        const progress = planetProgress[i].value;
        const currentX = interpolate(progress, [0, 1], [CHART_CENTER, targetPos.x]);
        const currentY = interpolate(progress, [0, 1], [CHART_CENTER, targetPos.y]);
        return {
          position: 'absolute' as const,
          left: currentX - planet.size - 4,
          top: currentY - planet.size - 4,
          opacity: planetOpacity[i].value,
        };
      });

      return (
        <Animated.View key={`planet-${i}`} style={animatedStyle}>
          <Svg
            width={(planet.size + 4) * 2}
            height={(planet.size + 4) * 2}
          >
            {/* Outer glow aura */}
            <Circle
              cx={planet.size + 4}
              cy={planet.size + 4}
              r={planet.size + 3}
              fill={planet.glowColor}
            />
            {/* Middle glow ring */}
            <Circle
              cx={planet.size + 4}
              cy={planet.size + 4}
              r={planet.size + 1}
              fill={planet.glowColor}
              opacity={0.6}
            />
            {/* Core dot */}
            <Circle
              cx={planet.size + 4}
              cy={planet.size + 4}
              r={planet.size}
              fill={planet.color}
            />
            {/* Bright center highlight */}
            <Circle
              cx={planet.size + 3}
              cy={planet.size + 3}
              r={planet.size * 0.35}
              fill="#FFFFFF"
              opacity={0.5}
            />
          </Svg>
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.chartContainer}>
      {/* Radial glow behind the chart — golden pulse */}
      <Animated.View style={[styles.chartGlow, glowAnimatedStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(212, 165, 71, 0.15)', 'rgba(212, 165, 71, 0.04)', 'transparent']}
          style={styles.chartGlowGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* The chart itself — breathing animation wrapper */}
      <Animated.View style={[styles.chartSvgWrapper, chartAnimatedStyle]}>
        {/* Static SVG layer: rings, lines, symbols */}
        <Svg
          width={CHART_SIZE}
          height={CHART_SIZE}
          viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        >
          <Defs>
            <RadialGradient id="chartCenterGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.1" />
              <Stop offset="50%" stopColor={colors.accentGold} stopOpacity="0.03" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Subtle center glow */}
          <Circle
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            r={OUTER_RADIUS}
            fill="url(#chartCenterGlow)"
          />

          {/* Outer ring — stroke-dash animated (or static on web) */}
          {(IS_WEB) ? (
            <Circle
              cx={CHART_CENTER}
              cy={CHART_CENTER}
              r={OUTER_RADIUS}
              stroke={colors.accentGold}
              strokeWidth={1.2}
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <AnimatedCircle
              cx={CHART_CENTER}
              cy={CHART_CENTER}
              r={OUTER_RADIUS}
              stroke={colors.accentGold}
              strokeWidth={1.2}
              fill="none"
              strokeDasharray={`${outerRingCircumference}`}
              animatedProps={outerRingAnimatedProps}
              strokeLinecap="round"
            />
          )}

          {/* Inner ring (zodiac band inner boundary) */}
          {(IS_WEB) ? (
            <Circle
              cx={CHART_CENTER}
              cy={CHART_CENTER}
              r={ZODIAC_RING_INNER}
              stroke={colors.accentGold}
              strokeWidth={0.6}
              fill="none"
              strokeLinecap="round"
              opacity={0.7}
            />
          ) : (
            <AnimatedCircle
              cx={CHART_CENTER}
              cy={CHART_CENTER}
              r={ZODIAC_RING_INNER}
              stroke={colors.accentGold}
              strokeWidth={0.6}
              fill="none"
              strokeDasharray={`${2 * Math.PI * ZODIAC_RING_INNER}`}
              animatedProps={innerRingAnimatedProps}
              strokeLinecap="round"
              opacity={0.7}
            />
          )}

          {/* Small center point ring */}
          {(IS_WEB) ? (
            <Circle
              cx={CHART_CENTER}
              cy={CHART_CENTER}
              r={HOUSE_RING_INNER}
              stroke={colors.chartLineFaint}
              strokeWidth={0.4}
              fill="none"
            />
          ) : (
            <AnimatedCircle
              cx={CHART_CENTER}
              cy={CHART_CENTER}
              r={HOUSE_RING_INNER}
              stroke={colors.chartLineFaint}
              strokeWidth={0.4}
              fill="none"
              strokeDasharray={`${2 * Math.PI * HOUSE_RING_INNER}`}
              animatedProps={centerRingAnimatedProps}
            />
          )}

          {/* Center decorative dot */}
          <Circle
            cx={CHART_CENTER}
            cy={CHART_CENTER}
            r={3}
            fill={colors.accentGold}
            opacity={0.4}
          />

          {/* Zodiac boundary ticks */}
          {renderZodiacTicks()}

          {/* Zodiac symbol labels */}
          {renderZodiacSymbols()}

          {/* House division lines */}
          {renderHouseLines()}

          {/* House number labels */}
          {renderHouseNumbers()}

          {/* ASC / MC labels on cardinal lines */}
          {(() => {
            const ascPos = polarToCartesian(CHART_CENTER, CHART_CENTER, HOUSE_RING_OUTER + 14, HOUSE_CUSPS[0]);
            const mcPos = polarToCartesian(CHART_CENTER, CHART_CENTER, HOUSE_RING_OUTER + 14, HOUSE_CUSPS[9]);

            // On web, use static SvgText; on native, use AnimatedSvgText
            if (IS_WEB) {
              return (
                <>
                  <SvgText
                    x={ascPos.x} y={ascPos.y + 3}
                    textAnchor="middle"
                    fontSize={7}
                    fill={colors.accentGold}
                    fontWeight="600"
                    letterSpacing={1}
                    opacity={0.7}
                  >
                    ASC
                  </SvgText>
                  <SvgText
                    x={mcPos.x} y={mcPos.y + 3}
                    textAnchor="middle"
                    fontSize={7}
                    fill={colors.accentGold}
                    fontWeight="600"
                    letterSpacing={1}
                    opacity={0.5}
                  >
                    MC
                  </SvgText>
                </>
              );
            }

            return (
              <>
                <AnimatedSvgText
                  x={ascPos.x} y={ascPos.y + 3}
                  textAnchor="middle"
                  fontSize={7}
                  fill={colors.accentGold}
                  fontWeight="600"
                  letterSpacing={1}
                  animatedProps={ascLabelAnimatedProps}
                >
                  ASC
                </AnimatedSvgText>
                <AnimatedSvgText
                  x={mcPos.x} y={mcPos.y + 3}
                  textAnchor="middle"
                  fontSize={7}
                  fill={colors.accentGold}
                  fontWeight="600"
                  letterSpacing={1}
                  animatedProps={mcLabelAnimatedProps}
                >
                  MC
                </AnimatedSvgText>
              </>
            );
          })()}
        </Svg>

        {/* Planet dots (positioned absolutely over the SVG) */}
        {renderPlanets()}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// BIG THREE HIGHLIGHT CARD
// Each card shows one placement (Sun, Moon, Rising) with icon,
// sign name, archetype, and brief description.
// Slides up with stagger after the chart animation completes.
// ─────────────────────────────────────────────────────────────

interface HighlightCardProps {
  highlight: BigThreeHighlight;
  index: number;
}

function HighlightCard({ highlight, index }: HighlightCardProps) {
  const delay = TIMING.highlightDelay + index * TIMING.highlightStagger;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.highlightDuration)
        .delay(delay)
        .easing(Easing.out(Easing.cubic))}
      style={styles.highlightCard}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FDFBF7']}
        style={styles.highlightGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Left accent strip */}
        <View
          style={[
            styles.highlightAccentStrip,
            { backgroundColor: highlight.accentColor },
          ]}
        />

        <View style={styles.highlightContent}>
          {/* Icon + label row */}
          <View style={styles.highlightHeader}>
            <Text style={[styles.highlightIcon, { color: highlight.accentColor }]}>
              {highlight.icon}
            </Text>
            <View style={styles.highlightLabelContainer}>
              <Text style={styles.highlightLabel}>{highlight.label}</Text>
              <Text style={styles.highlightSign}>
                {highlight.sign}{' '}
                <Text style={styles.highlightArchetype}>— {highlight.archetype}</Text>
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.highlightDescription}>{highlight.description}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: ChartRevealScreen
// ─────────────────────────────────────────────────────────────

export default function ChartRevealScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();
  const userName = data?.name || 'You';

  // ── CTA button animation ──
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);

  useEffect(() => {
    // Subtle continuous glow on the CTA after it appears
    buttonGlow.value = withDelay(
      TIMING.ctaDelay + 500,
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

  const handleDiscoverStory = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(auth)/onboarding/personality');
  };

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
    shadowOpacity: interpolate(buttonGlow.value, [0, 1], [0.3, 0.55]),
    shadowRadius: interpolate(buttonGlow.value, [0, 1], [12, 20]),
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Background gradient — slightly richer than other screens ── */}
      <LinearGradient
        colors={['#FDFBF7', '#FAF6EE', '#F5F0E8']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Background constellations ── */}
      <BackgroundConstellation />

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
          {/* ── Headline: "{Name}'s Cosmic Blueprint" ── */}
          <Animated.Text
            entering={FadeInDown.duration(TIMING.headlineFadeIn)
              .delay(200)
              .easing(Easing.out(Easing.ease))}
            style={styles.headline}
            accessibilityRole="header"
          >
            {userName}'s{'\n'}Cosmic Blueprint
          </Animated.Text>

          {/* ── Subtitle ── */}
          <Animated.Text
            entering={FadeInDown.duration(500).delay(500).easing(Easing.out(Easing.ease))}
            style={styles.subtitle}
          >
            The stars aligned at the moment of your birth
          </Animated.Text>

          {/* ── The Natal Chart Wheel ── */}
          <NatalChartWheel />

          {/* ── Big Three Highlights ── */}
          <View style={styles.highlightsContainer}>
            <Animated.Text
              entering={FadeIn.duration(400).delay(TIMING.highlightDelay - 200)}
              style={styles.highlightsTitle}
            >
              Your Big Three
            </Animated.Text>

            {BIG_THREE.map((highlight, index) => (
              <HighlightCard
                key={highlight.label}
                highlight={highlight}
                index={index}
              />
            ))}
          </View>

          {/* ── Bottom spacer ── */}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* ── CTA Button: "Discover Your Story" (fixed at bottom) ── */}
        <Animated.View
          entering={FadeInUp.duration(TIMING.ctaDuration)
            .delay(TIMING.ctaDelay)
            .easing(Easing.out(Easing.ease))}
          style={styles.ctaContainer}
        >
          <AnimatedPressable
            onPress={handleDiscoverStory}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.ctaButton, buttonAnimatedStyle, buttonGlowStyle]}
            accessibilityRole="button"
            accessibilityLabel="Discover Your Story"
            accessibilityHint="Proceeds to your personalized personality reading"
          >
            <Text style={styles.ctaText}>Discover Your Story</Text>
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
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // ── Headline ──
  headline: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display1,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.display1 * 1.2,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(212, 165, 71, 0.12)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
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
    marginBottom: spacing.lg,
  },

  // ── Chart Container ──
  chartContainer: {
    width: CHART_SIZE + 40,
    height: CHART_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  chartGlow: {
    position: 'absolute',
    width: CHART_SIZE + 80,
    height: CHART_SIZE + 80,
    borderRadius: (CHART_SIZE + 80) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartGlowGradient: {
    width: CHART_SIZE + 80,
    height: CHART_SIZE + 80,
    borderRadius: (CHART_SIZE + 80) / 2,
  },

  chartSvgWrapper: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Big Three Highlights ──
  highlightsContainer: {
    width: '100%',
    paddingHorizontal: spacing.xs,
  },

  highlightsTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },

  highlightCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(212, 165, 71, 0.12)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },

  highlightGradient: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.12)',
    overflow: 'hidden',
  },

  highlightAccentStrip: {
    width: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },

  highlightContent: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },

  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  highlightIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
    lineHeight: 28,
  },

  highlightLabelContainer: {
    flex: 1,
  },

  highlightLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  highlightSign: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  highlightArchetype: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },

  highlightDescription: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    lineHeight: typography.sizes.caption * 1.55,
    letterSpacing: 0.15,
  },

  // ── CTA Button ──
  ctaContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.sm,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    height: 56,
    gap: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
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
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  ctaArrow: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
