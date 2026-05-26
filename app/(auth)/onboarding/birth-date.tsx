/**
 * VEYa — Screen 03: Birth Date
 *
 * Collects the user's birth date via a luxurious custom scroll-wheel picker.
 * After selection, reveals their Sun sign with a magical gold-glow animation.
 * No keyboard appears — this is a picker-only screen.
 *
 * Design direction: Premium scroll wheels · Zodiac delight moment ·
 * Warm cream + gold accents · Minimalist luxury, never utilitarian
 *
 * @module screens/onboarding/birth-date
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
  FlatList,
  ViewToken,
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
  interpolateColor,
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
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (identical to Screens 01 & 02)
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
  accentRose: '#E8788A',
  overlay: 'rgba(26, 26, 46, 0.7)',
  error: '#D4564E',
  inputBorder: '#DDD8CE',
  inputBorderFocused: '#D4A547',
  disabled: '#C5C0B6',
  pickerHighlight: 'rgba(212, 165, 71, 0.08)',
  pickerBorder: 'rgba(212, 165, 71, 0.25)',
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
    body: 16,
    bodySmall: 14,
    caption: 13,
    tiny: 11,
    pickerItem: 20,
    pickerItemSelected: 22,
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
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// DIMENSIONS & CONSTANTS
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 9;
const CURRENT_STEP = 2; // 0-indexed: step 2 of 8 (3rd dot)

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5; // Number of visible rows in the picker
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Fixed column widths that fit within 360px maxWidth container
// Month: 130px, Day: 65px, Year: 95px = 290px total (with gaps)
const COLUMN_WIDTH_MONTH = 130;
const COLUMN_WIDTH_DAY = 65;
const COLUMN_WIDTH_YEAR = 95;

const IS_WEB = Platform.OS === 'web';

// ─────────────────────────────────────────────────────────────
// DATE DATA
// ─────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function generateYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 13; y >= currentYear - 120; y--) {
    years.push(y);
  }
  return years;
}

function generateDays(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}

// ─────────────────────────────────────────────────────────────
// ZODIAC SIGN CALCULATION
// ─────────────────────────────────────────────────────────────

interface ZodiacSign {
  name: string;
  symbol: string;
  emoji: string;
  element: 'fire' | 'earth' | 'air' | 'water';
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: 'Capricorn', symbol: '♑', emoji: '🐐', element: 'earth' },
  { name: 'Aquarius', symbol: '♒', emoji: '🏺', element: 'air' },
  { name: 'Pisces', symbol: '♓', emoji: '🐟', element: 'water' },
  { name: 'Aries', symbol: '♈', emoji: '🐏', element: 'fire' },
  { name: 'Taurus', symbol: '♉', emoji: '🐂', element: 'earth' },
  { name: 'Gemini', symbol: '♊', emoji: '👯', element: 'air' },
  { name: 'Cancer', symbol: '♋', emoji: '🦀', element: 'water' },
  { name: 'Leo', symbol: '♌', emoji: '🦁', element: 'fire' },
  { name: 'Virgo', symbol: '♍', emoji: '🌾', element: 'earth' },
  { name: 'Libra', symbol: '♎', emoji: '⚖️', element: 'air' },
  { name: 'Scorpio', symbol: '♏', emoji: '🦂', element: 'water' },
  { name: 'Sagittarius', symbol: '♐', emoji: '🏹', element: 'fire' },
];

// Zodiac date boundaries (month, day) — start dates
const ZODIAC_BOUNDARIES: [number, number][] = [
  [0, 20],   // Aquarius: Jan 20
  [1, 19],   // Pisces: Feb 19
  [2, 21],   // Aries: Mar 21
  [3, 20],   // Taurus: Apr 20
  [4, 21],   // Gemini: May 21
  [5, 21],   // Cancer: Jun 21
  [6, 23],   // Leo: Jul 23
  [7, 23],   // Virgo: Aug 23
  [8, 23],   // Libra: Sep 23
  [9, 23],   // Scorpio: Oct 23
  [10, 22],  // Sagittarius: Nov 22
  [11, 22],  // Capricorn: Dec 22
];

function getSunSign(month: number, day: number): ZodiacSign {
  // month is 0-indexed
  for (let i = ZODIAC_BOUNDARIES.length - 1; i >= 0; i--) {
    const [bMonth, bDay] = ZODIAC_BOUNDARIES[i];
    if (month > bMonth || (month === bMonth && day >= bDay)) {
      return ZODIAC_SIGNS[(i + 1) % 12];
    }
  }
  return ZODIAC_SIGNS[0]; // Capricorn (default for early January)
}

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#E8664D',
  earth: '#6B8E6B',
  air: '#D4A547',
  water: '#5B8DB8',
};

// ─────────────────────────────────────────────────────────────
// ANIMATED COMPONENTS
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES (same as Screen 02 — subtle)
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
  const goldTones = [
    'rgba(212, 165, 71, 0.5)',
    'rgba(212, 165, 71, 0.3)',
    'rgba(139, 92, 246, 0.15)',
    'rgba(232, 120, 138, 0.15)',
    'rgba(212, 165, 71, 0.4)',
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH,
      cy: Math.random() * SCREEN_HEIGHT,
      r: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      delay: Math.random() * 4000,
      duration: Math.random() * 6000 + 5000,
      driftX: (Math.random() - 0.5) * 25,
      driftY: (Math.random() - 0.5) * 30,
      color: goldTones[Math.floor(Math.random() * goldTones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(5);

function StardustParticle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftX, {
            duration: config.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-config.driftX * 0.7, {
            duration: config.duration * 0.8,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftY, {
            duration: config.duration * 1.1,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-config.driftY * 0.6, {
            duration: config.duration * 0.9,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.opacity, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(config.opacity * 0.2, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
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
// PROGRESS INDICATOR (identical to Screen 02)
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
// COSMIC SPARKLE ICON (same as Screen 02)
// ─────────────────────────────────────────────────────────────

function CosmicSparkle() {
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.15, {
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1, {
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  return (
    <Animated.View style={[styles.sparkleContainer, animatedStyle]}>
      <Svg width={48} height={48} viewBox="0 0 48 48">
        <Defs>
          <RadialGradient id="sparkleGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="24" cy="24" r="20" fill="url(#sparkleGlow)" />
        <Path
          d="M24 6 L27 20 L42 24 L27 28 L24 42 L21 28 L6 24 L21 20 Z"
          fill={colors.accentGold}
          opacity={0.45}
        />
        <Path
          d="M24 14 L25.5 21 L33 24 L25.5 27 L24 34 L22.5 27 L15 24 L22.5 21 Z"
          fill={colors.accentGold}
          opacity={0.7}
        />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// BACK BUTTON (identical to Screen 02)
// ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the name screen"
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
// SCROLL WHEEL PICKER COLUMN
// A premium-styled scroll wheel column that mimics iOS-style
// picker but with custom luxury styling. Uses FlatList with
// snap-to-interval for smooth, elegant scrolling.
// ─────────────────────────────────────────────────────────────

interface WheelColumnProps {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width: number;
  label?: string;
}

function WheelColumn({ data, selectedIndex, onSelect, width, label }: WheelColumnProps) {
  const flatListRef = useRef<FlatList>(null);
  const isScrolling = useRef(false);

  // Pad data with empty items at start/end for the visual offset
  const paddedData = useMemo(() => {
    const padding = Math.floor(VISIBLE_ITEMS / 2);
    const padItems = Array.from({ length: padding }, (_, i) => '');
    return [...padItems, ...data, ...padItems];
  }, [data]);

  // Scroll to selected index on mount and when selectedIndex changes externally
  useEffect(() => {
    if (flatListRef.current && !isScrolling.current) {
      flatListRef.current.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

      isScrolling.current = false;

      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
        if (Platform.OS === 'ios') {
          Haptics.selectionAsync();
        }
      }
    },
    [data.length, onSelect, selectedIndex]
  );

  const handleScrollBegin = useCallback(() => {
    isScrolling.current = true;
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const padding = Math.floor(VISIBLE_ITEMS / 2);
      const dataIndex = index - padding;
      const isSelected = dataIndex === selectedIndex;
      const isEmpty = item === '';

      return (
        <View style={[styles.pickerItem, { width, height: ITEM_HEIGHT }]}>
          {!isEmpty && (
            <Text
              style={[
                styles.pickerItemText,
                isSelected && styles.pickerItemTextSelected,
                !isSelected && styles.pickerItemTextDimmed,
              ]}
              numberOfLines={1}
            >
              {item}
            </Text>
          )}
        </View>
      );
    },
    [selectedIndex, width]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback(
    (_: string, index: number) => `${label}-${index}`,
    [label]
  );

  return (
    <View style={[styles.wheelColumn, { width, height: PICKER_HEIGHT }]}>
      {/* Column label */}
      {label && (
        <Text style={styles.wheelLabel}>{label}</Text>
      )}

      <FlatList
        ref={flatListRef}
        data={paddedData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBegin}
        initialScrollIndex={selectedIndex}
        nestedScrollEnabled
        contentContainerStyle={{
          paddingVertical: 0, // Padding handled by empty items
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// WEB DATE PICKER
// Uses native HTML select elements for reliable web experience.
// FlatList snapToInterval doesn't work properly on web.
// ─────────────────────────────────────────────────────────────

interface WebDatePickerProps {
  selectedMonth: number;
  selectedDay: number;
  selectedYearIndex: number;
  years: number[];
  days: number[];
  onMonthChange: (index: number) => void;
  onDayChange: (index: number) => void;
  onYearChange: (index: number) => void;
}

function WebDatePicker({
  selectedMonth,
  selectedDay,
  selectedYearIndex,
  years,
  days,
  onMonthChange,
  onDayChange,
  onYearChange,
}: WebDatePickerProps) {
  const selectStyle = {
    fontFamily: typography.fonts.displayRegular,
    fontSize: typography.sizes.pickerItem,
    color: colors.textPrimary,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${colors.pickerBorder}`,
    padding: '12px 8px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    outline: 'none',
  };

  return (
    <View style={styles.webPickerContainer}>
      {/* Month select */}
      <View style={styles.webSelectWrapper}>
        <Text style={styles.webSelectLabel}>Month</Text>
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          style={{ ...selectStyle, width: COLUMN_WIDTH_MONTH }}
        >
          {MONTHS.map((month, index) => (
            <option key={month} value={index}>
              {month}
            </option>
          ))}
        </select>
      </View>

      {/* Day select */}
      <View style={styles.webSelectWrapper}>
        <Text style={styles.webSelectLabel}>Day</Text>
        <select
          value={selectedDay}
          onChange={(e) => onDayChange(Number(e.target.value))}
          style={{ ...selectStyle, width: COLUMN_WIDTH_DAY }}
        >
          {days.map((day, index) => (
            <option key={day} value={index}>
              {day}
            </option>
          ))}
        </select>
      </View>

      {/* Year select */}
      <View style={styles.webSelectWrapper}>
        <Text style={styles.webSelectLabel}>Year</Text>
        <select
          value={selectedYearIndex}
          onChange={(e) => onYearChange(Number(e.target.value))}
          style={{ ...selectStyle, width: COLUMN_WIDTH_YEAR }}
        >
          {years.map((year, index) => (
            <option key={year} value={index}>
              {year}
            </option>
          ))}
        </select>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// ZODIAC REVEAL BADGE
// Appears after date selection with a gentle gold-glow animation.
// Shows the zodiac symbol and name with sparkle effect.
// ─────────────────────────────────────────────────────────────

function ZodiacRevealBadge({ sign }: { sign: ZodiacSign }) {
  const glowOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const sparkleRotation = useSharedValue(0);

  useEffect(() => {
    // Entry animation sequence
    glowOpacity.value = withSequence(
      withTiming(0.6, { duration: 600, easing: Easing.out(Easing.ease) }),
      withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
    );

    scaleValue.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });

    // Gentle sparkle rotation
    sparkleRotation.value = withRepeat(
      withTiming(360, {
        duration: 20000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [sign.name]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const elementColor = ELEMENT_COLORS[sign.element];

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={styles.zodiacRevealContainer}
    >
      {/* Outer gold glow */}
      <Animated.View style={[styles.zodiacGlow, glowStyle]}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Defs>
            <RadialGradient id="zodiacGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.35" />
              <Stop offset="50%" stopColor={colors.accentGold} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="60" cy="60" r="60" fill="url(#zodiacGlow)" />
        </Svg>
      </Animated.View>

      {/* Rotating sparkle ring */}
      <Animated.View style={[styles.sparkleRing, sparkleStyle]}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const cx = 40 + Math.cos(rad) * 32;
            const cy = 40 + Math.sin(rad) * 32;
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={1.2}
                fill={colors.accentGold}
                opacity={0.5 - i * 0.05}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Badge content */}
      <Animated.View style={[styles.zodiacBadge, badgeStyle]}>
        <Text style={styles.zodiacSymbol}>{sign.symbol}</Text>
        <Text style={styles.zodiacName}>{sign.name}</Text>
        <View style={[styles.elementDot, { backgroundColor: elementColor }]} />
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: BirthDateScreen
// ─────────────────────────────────────────────────────────────

export default function BirthDateScreen() {
  const insets = useSafeAreaInsets();
  const { data, updateData, nextStep } = useOnboardingStore();

  // Default to year 2000
  const YEARS = useMemo(() => generateYears(), []);
  const DEFAULT_YEAR_INDEX = YEARS.indexOf(2000) !== -1 ? YEARS.indexOf(2000) : 0;

  // State
  const [selectedMonth, setSelectedMonth] = useState(0); // January
  const [selectedDay, setSelectedDay] = useState(0);      // 1st
  const [selectedYearIndex, setSelectedYearIndex] = useState(DEFAULT_YEAR_INDEX);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showZodiac, setShowZodiac] = useState(false);
  const zodiacTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived
  const selectedYear = YEARS[selectedYearIndex];
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = useMemo(() => generateDays(daysInMonth), [daysInMonth]);
  const actualDay = Math.min(selectedDay + 1, daysInMonth);
  const sunSign = getSunSign(selectedMonth, actualDay);

  // Clamp day if month changes to one with fewer days
  useEffect(() => {
    if (selectedDay >= daysInMonth) {
      setSelectedDay(daysInMonth - 1);
    }
  }, [daysInMonth]);

  // Show zodiac sign after user interacts
  useEffect(() => {
    if (hasInteracted) {
      // Debounce: wait 600ms after last scroll to show zodiac
      if (zodiacTimerRef.current) {
        clearTimeout(zodiacTimerRef.current);
      }
      zodiacTimerRef.current = setTimeout(() => {
        setShowZodiac(true);
      }, 600);
    }
    return () => {
      if (zodiacTimerRef.current) {
        clearTimeout(zodiacTimerRef.current);
      }
    };
  }, [selectedMonth, selectedDay, selectedYearIndex, hasInteracted]);

  // Validation
  const isValid = useMemo(() => {
    if (!hasInteracted) return false;
    const date = new Date(selectedYear, selectedMonth, actualDay);
    const now = new Date();
    if (date >= now) return false;
    const age = now.getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120;
  }, [selectedYear, selectedMonth, actualDay, hasInteracted]);

  // Animation values
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0.4);

  useEffect(() => {
    buttonOpacity.value = withTiming(isValid ? 1 : 0.4, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [isValid]);

  // ── Handlers ──
  const handleBack = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleContinue = async () => {
    if (!isValid) return;

    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Store birth date data
    updateData({
      birthDate: new Date(selectedYear, selectedMonth, actualDay).toISOString(),
      sunSign: sunSign.name,
    });

    nextStep();
    router.push('/(auth)/onboarding/birth-time');
  };

  const handlePressIn = () => {
    if (!isValid) return;
    buttonScale.value = withTiming(0.95, {
      duration: 100,
      easing: Easing.out(Easing.ease),
    });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
  };

  const handleMonthSelect = useCallback((index: number) => {
    setSelectedMonth(index);
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  const handleDaySelect = useCallback((index: number) => {
    setSelectedDay(index);
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  const handleYearSelect = useCallback((index: number) => {
    setSelectedYearIndex(index);
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  // ── Animated styles ──
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  // ── Formatted strings for picker ──
  const monthStrings = useMemo(() => MONTHS.map(m => m), []);
  const dayStrings = useMemo(() => days.map(d => String(d)), [days]);
  const yearStrings = useMemo(() => YEARS.map(y => String(y)), []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={['#FDFBF7', '#F8F4EC', '#F5F0E8']}
        locations={[0, 0.6, 1]}
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
          <ProgressDots
            currentStep={CURRENT_STEP}
            totalSteps={TOTAL_STEPS}
          />
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* ── Upper spacer ── */}
        <View style={styles.topSpacer} />

        {/* ── Cosmic sparkle icon ── */}
        <Animated.View
          entering={FadeIn.duration(800).delay(150).easing(Easing.out(Easing.ease))}
        >
          <CosmicSparkle />
        </Animated.View>

        {/* ── Headline ── */}
        <Animated.Text
          entering={FadeInDown.duration(700).delay(250).easing(Easing.out(Easing.ease))}
          style={styles.headline}
          accessibilityRole="header"
        >
          When were you{'\n'}born?
        </Animated.Text>

        {/* ── Subtext ── */}
        <Animated.Text
          entering={FadeInDown.duration(600).delay(350).easing(Easing.out(Easing.ease))}
          style={styles.subtext}
        >
          Your birth date reveals your Sun sign{'\n'}and cosmic blueprint
        </Animated.Text>

        {/* ── Date Picker Container ── */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(450).easing(Easing.out(Easing.ease))}
          style={styles.pickerContainer}
        >
          {IS_WEB ? (
            /* Web: Use native HTML select elements */
            <WebDatePicker
              selectedMonth={selectedMonth}
              selectedDay={selectedDay}
              selectedYearIndex={selectedYearIndex}
              years={YEARS}
              days={days}
              onMonthChange={handleMonthSelect}
              onDayChange={handleDaySelect}
              onYearChange={handleYearSelect}
            />
          ) : (
            /* Native: Use scroll wheel picker */
            <>
              {/* Highlight band for selected row */}
              <View style={styles.selectionHighlight} />

              {/* Top fade gradient */}
              <LinearGradient
                colors={['rgba(253, 251, 247, 1)', 'rgba(253, 251, 247, 0)']}
                style={styles.pickerFadeTop}
                pointerEvents="none"
              />

              {/* Bottom fade gradient */}
              <LinearGradient
                colors={['rgba(253, 251, 247, 0)', 'rgba(253, 251, 247, 1)']}
                style={styles.pickerFadeBottom}
                pointerEvents="none"
              />

              {/* Picker columns - use fixed widths that fit within 360px container */}
              <View style={styles.pickerColumns}>
                <WheelColumn
                  data={monthStrings}
                  selectedIndex={selectedMonth}
                  onSelect={handleMonthSelect}
                  width={COLUMN_WIDTH_MONTH}
                  label="month"
                />
                <WheelColumn
                  data={dayStrings}
                  selectedIndex={selectedDay}
                  onSelect={handleDaySelect}
                  width={COLUMN_WIDTH_DAY}
                  label="day"
                />
                <WheelColumn
                  data={yearStrings}
                  selectedIndex={selectedYearIndex}
                  onSelect={handleYearSelect}
                  width={COLUMN_WIDTH_YEAR}
                  label="year"
                />
              </View>
            </>
          )}
        </Animated.View>

        {/* ── Zodiac Sign Reveal ── */}
        <View style={styles.zodiacArea}>
          {showZodiac && hasInteracted ? (
            <ZodiacRevealBadge sign={sunSign} />
          ) : (
            <View style={styles.zodiacPlaceholder} />
          )}
        </View>

        {/* ── Flexible space ── */}
        <View style={styles.middleSpacer} />

        {/* ── Continue button ── */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(550).easing(Easing.out(Easing.ease))}
        >
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isValid}
            style={[styles.ctaButton, buttonAnimatedStyle]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityHint="Proceeds to the birth time screen"
            accessibilityState={{ disabled: !isValid }}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* ── Bottom spacer ── */}
        <View style={styles.bottomSpacer} />
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

  // ── Spacers ──
  topSpacer: {
    flex: 0.06,
  },

  middleSpacer: {
    flex: 1,
    minHeight: spacing.lg,
  },

  bottomSpacer: {
    height: spacing.md,
  },

  // ── Sparkle ──
  sparkleContainer: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },

  // ── Headline ──
  headline: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display1,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.display1 * 1.25,
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
    lineHeight: typography.sizes.bodySmall * 1.5,
    letterSpacing: 0.2,
    maxWidth: 300,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },

  // ── Picker Container ──
  pickerContainer: {
    alignSelf: 'center',
    width: SCREEN_WIDTH - spacing.lg * 2,
    maxWidth: 360,
    height: PICKER_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },

  pickerColumns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: PICKER_HEIGHT,
  },

  // The gold-tinted highlight band behind the selected row
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: spacing.sm,
    right: spacing.sm,
    height: ITEM_HEIGHT,
    backgroundColor: colors.pickerHighlight,
    borderRadius: borderRadius.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.pickerBorder,
    zIndex: 0,
  },

  // Fade gradients at top/bottom of picker for depth
  pickerFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 2,
  },

  pickerFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 2,
  },

  // ── Wheel Column ──
  wheelColumn: {
    overflow: 'hidden',
  },

  wheelLabel: {
    display: 'none', // Hidden — used only as semantic label
  },

  pickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickerItemText: {
    fontFamily: typography.fonts.displayRegular,
    fontSize: typography.sizes.pickerItem,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  pickerItemTextSelected: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.pickerItemSelected,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },

  pickerItemTextDimmed: {
    color: colors.textMuted,
    opacity: 0.6,
  },

  // ── Zodiac Reveal ──
  zodiacArea: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },

  zodiacPlaceholder: {
    height: 80,
  },

  zodiacRevealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  zodiacGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sparkleRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  zodiacBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  zodiacSymbol: {
    fontSize: 28,
    color: colors.accentGold,
    marginBottom: 2,
    // Gold text glow
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(212, 165, 71, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
      },
      android: {},
    }),
  },

  zodiacName: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.bodySmall,
    color: colors.accentGold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  elementDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    opacity: 0.7,
  },

  // ── CTA Button (matches Screens 01 & 02 exactly) ──
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.sm,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    height: 56,
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

  // ── Web Date Picker Styles ──
  webPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: spacing.lg,
    height: PICKER_HEIGHT,
    paddingTop: spacing.xl,
  },

  webSelectWrapper: {
    alignItems: 'center',
  },

  webSelectLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
});
