/**
 * VEYa — Screen 04: Birth Time (3-Tier System)
 *
 * Collects the user's birth time via a graceful 3-tier approach:
 *   Tier 1: "I know exactly" → custom scroll-wheel time picker (hour:minute AM/PM)
 *   Tier 2: "I know approximately" → 4 time-of-day range cards
 *   Tier 3: "I'm not sure" → warm reassurance + noon chart default
 *
 * This is the CRITICAL screen — many users don't know their birth time.
 * The language is warm, supportive, and never shames the user.
 *
 * Design direction: Luxury light theme · Cream background · Playfair + Inter ·
 * Elegant option cards with cosmic purple accents · Smooth conditional reveals
 *
 * @module screens/onboarding/birth-time
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
  FadeOut,
  Layout,
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
// DESIGN TOKENS (identical to Screens 01–03)
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
  border: '#E5DFD5',
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
    heading2: 22,
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
  xl: 20,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// DIMENSIONS & CONSTANTS
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 9;
const CURRENT_STEP = 3; // 0-indexed: step 3 of 8 (4th dot)

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// ─────────────────────────────────────────────────────────────
// TIME DATA
// ─────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

type BirthTimeOption = 'exact' | 'approximate' | 'unknown' | null;
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeOfDayConfig {
  key: TimeOfDay;
  label: string;
  sublabel: string;
  emoji: string;
  gradientStart: string;
  gradientEnd: string;
  iconColor: string;
}

const TIME_OF_DAY_OPTIONS: TimeOfDayConfig[] = [
  {
    key: 'morning',
    label: 'Morning',
    sublabel: '6 AM – 12 PM',
    emoji: '🌅',
    gradientStart: '#FDF4E3',
    gradientEnd: '#FBE8C4',
    iconColor: '#D4A547',
  },
  {
    key: 'afternoon',
    label: 'Afternoon',
    sublabel: '12 PM – 6 PM',
    emoji: '☀️',
    gradientStart: '#FDF4E3',
    gradientEnd: '#F8E0B0',
    iconColor: '#E5A53D',
  },
  {
    key: 'evening',
    label: 'Evening',
    sublabel: '6 PM – 12 AM',
    emoji: '🌇',
    gradientStart: '#EDE9FE',
    gradientEnd: '#DDD4FB',
    iconColor: '#8B5CF6',
  },
  {
    key: 'night',
    label: 'Night',
    sublabel: '12 AM – 6 AM',
    emoji: '🌙',
    gradientStart: '#E8E4F5',
    gradientEnd: '#D4D0EA',
    iconColor: '#5B8DB8',
  },
];

// ─────────────────────────────────────────────────────────────
// ANIMATED COMPONENTS
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES (consistent with Screens 01–03)
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
// PROGRESS INDICATOR (identical to Screens 01–03)
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
// BACK BUTTON (identical to Screens 01–03)
// ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the birth date screen"
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
// SVG ICONS for the 3 option cards
// ─────────────────────────────────────────────────────────────

/** Clock icon — for "I know exactly" */
function ClockIcon({ color = colors.textSecondary, size = 28 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle
        cx="14"
        cy="14"
        r="11"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      {/* Hour hand */}
      <Line
        x1="14"
        y1="14"
        x2="14"
        y2="8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <Line
        x1="14"
        y1="14"
        x2="19"
        y2="14"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Center dot */}
      <Circle cx="14" cy="14" r="1.2" fill={color} />
    </Svg>
  );
}

/** Sun icon — for "I know approximately" */
function SunIcon({ color = colors.textSecondary, size = 28 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      {/* Sun body */}
      <Circle
        cx="14"
        cy="14"
        r="5"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 14 + Math.cos(rad) * 7.5;
        const y1 = 14 + Math.sin(rad) * 7.5;
        const x2 = 14 + Math.cos(rad) * 10.5;
        const y2 = 14 + Math.sin(rad) * 10.5;
        return (
          <Line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

/** Question mark icon — for "I'm not sure" */
function QuestionIcon({ color = colors.textSecondary, size = 28 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle
        cx="14"
        cy="14"
        r="11"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      {/* Question mark curve */}
      <Path
        d="M10.5 10.5C10.5 8.5 12 7 14 7C16 7 17.5 8.5 17.5 10.5C17.5 12.5 14 13 14 15"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* Dot */}
      <Circle cx="14" cy="19" r="1.2" fill={color} />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// OPTION CARD COMPONENT
// A tappable card representing one of the 3 birth time options.
// Selected state: cosmic purple border + subtle glow.
// ─────────────────────────────────────────────────────────────

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onPress: () => void;
  delay?: number;
}

function OptionCard({ icon, title, subtitle, isSelected, onPress, delay = 0 }: OptionCardProps) {
  const scaleValue = useSharedValue(1);

  const handlePressIn = () => {
    scaleValue.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay).easing(Easing.out(Easing.ease))}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.optionCard,
          isSelected && styles.optionCardSelected,
          cardAnimatedStyle,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={title}
        accessibilityHint={subtitle}
      >
        {/* Purple glow behind selected card */}
        {isSelected && (
          <View style={styles.optionCardGlow} />
        )}

        <View style={styles.optionCardContent}>
          <View style={[
            styles.optionIconContainer,
            isSelected && styles.optionIconContainerSelected,
          ]}>
            {icon}
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={[
              styles.optionTitle,
              isSelected && styles.optionTitleSelected,
            ]}>
              {title}
            </Text>
            <Text style={styles.optionSubtitle}>{subtitle}</Text>
          </View>

          {/* Selection indicator */}
          <View style={[
            styles.radioOuter,
            isSelected && styles.radioOuterSelected,
          ]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// TIME-OF-DAY CARD (for Tier 2: Approximate)
// Elegant mini-card with soft gradient and time range label.
// ─────────────────────────────────────────────────────────────

interface TimeOfDayCardProps {
  config: TimeOfDayConfig;
  isSelected: boolean;
  onPress: () => void;
  delay?: number;
}

function TimeOfDayCard({ config, isSelected, onPress, delay = 0 }: TimeOfDayCardProps) {
  const scaleValue = useSharedValue(1);

  const handlePressIn = () => {
    scaleValue.value = withTiming(0.95, { duration: 80 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).easing(Easing.out(Easing.ease))}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.todCard,
          isSelected && styles.todCardSelected,
          animatedStyle,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${config.label}: ${config.sublabel}`}
      >
        <LinearGradient
          colors={[config.gradientStart, config.gradientEnd]}
          style={styles.todGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.todEmoji}>{config.emoji}</Text>
          <Text style={[
            styles.todLabel,
            isSelected && styles.todLabelSelected,
          ]}>
            {config.label}
          </Text>
          <Text style={styles.todSublabel}>{config.sublabel}</Text>
        </LinearGradient>

        {/* Selected border overlay */}
        {isSelected && <View style={styles.todSelectedBorder} />}
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// SCROLL WHEEL PICKER COLUMN
// Reused from Screen 03 — same premium scroll-wheel UX.
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

  const paddedData = useMemo(() => {
    const padding = Math.floor(VISIBLE_ITEMS / 2);
    const padItems = Array.from({ length: padding }, () => '');
    return [...padItems, ...data, ...padItems];
  }, [data]);

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
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// REASSURANCE CALLOUT (for Tier 3: "I'm not sure")
// Soft, warm callout card that makes the user feel comfortable.
// ─────────────────────────────────────────────────────────────

function ReassuranceCallout() {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).easing(Easing.out(Easing.ease))}
      style={styles.reassuranceContainer}
    >
      <LinearGradient
        colors={['#FDF4E3', '#FDEFD5']}
        style={styles.reassuranceGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Warm sparkle icon */}
        <View style={styles.reassuranceIconRow}>
          <Text style={styles.reassuranceEmoji}>✨</Text>
        </View>

        <Text style={styles.reassuranceTitle}>That's perfectly okay!</Text>

        <Text style={styles.reassuranceText}>
          We'll use a noon chart, which still provides deep and meaningful
          insights into your cosmic identity. You can always update your birth
          time later if you discover it.
        </Text>

        <View style={styles.reassuranceDivider} />

        <Text style={styles.reassuranceTip}>
          💡 Tip: Check your birth certificate or ask a family member — even an
          approximate time helps!
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: BirthTimeScreen
// ─────────────────────────────────────────────────────────────

export default function BirthTimeScreen() {
  const insets = useSafeAreaInsets();
  const { data, updateData, nextStep, completeOnboarding } = useOnboardingStore();

  // ── State ──
  const [selectedOption, setSelectedOption] = useState<BirthTimeOption>(null);
  const [selectedHour, setSelectedHour] = useState(11);     // 12 (0-indexed → 12)
  const [selectedMinute, setSelectedMinute] = useState(0);   // :00
  const [selectedPeriod, setSelectedPeriod] = useState(0);   // AM
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay | null>(null);

  // ── Derived ──
  const isValid = useMemo(() => {
    if (selectedOption === 'exact') return true;
    if (selectedOption === 'approximate') return selectedTimeOfDay !== null;
    if (selectedOption === 'unknown') return true;
    return false;
  }, [selectedOption, selectedTimeOfDay]);

  // ── Animation values ──
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

  const handleOptionSelect = async (option: BirthTimeOption) => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedOption(option);
    // Reset time-of-day selection when switching options
    if (option !== 'approximate') {
      setSelectedTimeOfDay(null);
    }
  };

  const handleTimeOfDaySelect = async (tod: TimeOfDay) => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTimeOfDay(tod);
  };

  const handleContinue = async () => {
    if (!isValid) return;

    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Build birth time data based on selected option
    if (selectedOption === 'exact') {
      const hour24 =
        selectedPeriod === 1
          ? (selectedHour + 1 === 12 ? 12 : selectedHour + 1 + 12)
          : (selectedHour + 1 === 12 ? 0 : selectedHour + 1);
      const minute = selectedMinute;
      const timeStr = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

      updateData({
        birthTime: new Date(`2000-01-01T${timeStr}`) as any,
        birthTimeKnown: true,
        birthTimePrecision: 'exact',
      });
    } else if (selectedOption === 'approximate') {
      // Use midpoint of selected time range
      const midpoints: Record<TimeOfDay, string> = {
        morning: '09:00:00',
        afternoon: '15:00:00',
        evening: '21:00:00',
        night: '03:00:00',
      };
      const midpoint = midpoints[selectedTimeOfDay!];
      updateData({
        birthTime: new Date(`2000-01-01T${midpoint}`) as any,
        birthTimeKnown: true,
        birthTimePrecision: 'approximate',
        birthTimeRange: selectedTimeOfDay!,
      });
    } else {
      // Unknown — noon default
      updateData({
        birthTime: new Date('2000-01-01T12:00:00') as any,
        birthTimeKnown: false,
        birthTimePrecision: 'unknown',
      });
    }

    nextStep();
    router.push('/(auth)/onboarding/birth-place');
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

  // ── Animated styles ──
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  // ── Formatted strings for time picker ──
  const hourStrings = useMemo(() => HOURS, []);
  const minuteStrings = useMemo(() => MINUTES, []);
  const periodStrings = useMemo(() => PERIODS, []);

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

        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Headline ── */}
          <Animated.Text
            entering={FadeInDown.duration(700).delay(150).easing(Easing.out(Easing.ease))}
            style={styles.headline}
            accessibilityRole="header"
          >
            Do you know your{'\n'}birth time?
          </Animated.Text>

          {/* ── Subtext ── */}
          <Animated.Text
            entering={FadeInDown.duration(600).delay(250).easing(Easing.out(Easing.ease))}
            style={styles.subtext}
          >
            Your birth time reveals your Rising sign —{'\n'}the face you show the world
          </Animated.Text>

          {/* ── Three option cards ── */}
          <View style={styles.optionsContainer}>
            <OptionCard
              icon={<ClockIcon color={selectedOption === 'exact' ? colors.primary : colors.textSecondary} />}
              title="I know exactly"
              subtitle="Hour and minute"
              isSelected={selectedOption === 'exact'}
              onPress={() => handleOptionSelect('exact')}
              delay={300}
            />

            <OptionCard
              icon={<SunIcon color={selectedOption === 'approximate' ? colors.primary : colors.textSecondary} />}
              title="I know approximately"
              subtitle="General time of day"
              isSelected={selectedOption === 'approximate'}
              onPress={() => handleOptionSelect('approximate')}
              delay={350}
            />

            <OptionCard
              icon={<QuestionIcon color={selectedOption === 'unknown' ? colors.primary : colors.textSecondary} />}
              title="I'm not sure"
              subtitle="That's completely okay"
              isSelected={selectedOption === 'unknown'}
              onPress={() => handleOptionSelect('unknown')}
              delay={400}
            />
          </View>

          {/* ── Conditional content area ── */}

          {/* TIER 1: Exact time picker */}
          {selectedOption === 'exact' && (
            <Animated.View
              entering={FadeInDown.duration(500).easing(Easing.out(Easing.ease))}
              style={styles.conditionalContainer}
            >
              <Text style={styles.conditionalLabel}>Select your birth time</Text>

              <View style={styles.pickerContainer}>
                {/* Highlight band */}
                <View style={styles.selectionHighlight} />

                {/* Top fade */}
                <LinearGradient
                  colors={['rgba(253, 251, 247, 1)', 'rgba(253, 251, 247, 0)']}
                  style={styles.pickerFadeTop}
                  pointerEvents="none"
                />

                {/* Bottom fade */}
                <LinearGradient
                  colors={['rgba(253, 251, 247, 0)', 'rgba(253, 251, 247, 1)']}
                  style={styles.pickerFadeBottom}
                  pointerEvents="none"
                />

                {/* Picker columns: Hour : Minute  AM/PM */}
                <View style={styles.pickerColumns}>
                  <WheelColumn
                    data={hourStrings}
                    selectedIndex={selectedHour}
                    onSelect={setSelectedHour}
                    width={SCREEN_WIDTH * 0.18}
                    label="hour"
                  />

                  {/* Colon separator */}
                  <View style={styles.colonContainer}>
                    <Text style={styles.colonText}>:</Text>
                  </View>

                  <WheelColumn
                    data={minuteStrings}
                    selectedIndex={selectedMinute}
                    onSelect={setSelectedMinute}
                    width={SCREEN_WIDTH * 0.18}
                    label="minute"
                  />

                  {/* Spacer */}
                  <View style={{ width: spacing.sm }} />

                  <WheelColumn
                    data={periodStrings}
                    selectedIndex={selectedPeriod}
                    onSelect={setSelectedPeriod}
                    width={SCREEN_WIDTH * 0.18}
                    label="period"
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* TIER 2: Approximate time-of-day cards */}
          {selectedOption === 'approximate' && (
            <Animated.View
              entering={FadeInDown.duration(500).easing(Easing.out(Easing.ease))}
              style={styles.conditionalContainer}
            >
              <Text style={styles.conditionalLabel}>
                When were you born?
              </Text>

              <View style={styles.todGrid}>
                {TIME_OF_DAY_OPTIONS.map((config, index) => (
                  <TimeOfDayCard
                    key={config.key}
                    config={config}
                    isSelected={selectedTimeOfDay === config.key}
                    onPress={() => handleTimeOfDaySelect(config.key)}
                    delay={50 + index * 40}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* TIER 3: Reassurance message */}
          {selectedOption === 'unknown' && (
            <View style={styles.conditionalContainer}>
              <ReassuranceCallout />
            </View>
          )}

          {/* ── Bottom spacer for scroll ── */}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* ── Continue button (fixed at bottom) ── */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(450).easing(Easing.out(Easing.ease))}
          style={styles.ctaContainer}
        >
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isValid}
            style={[styles.ctaButton, buttonAnimatedStyle]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityHint="Proceeds to the birth place screen"
            accessibilityState={{ disabled: !isValid }}
          >
            <Text style={styles.ctaText}>Continue</Text>
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
    lineHeight: typography.sizes.bodySmall * 1.5,
    letterSpacing: 0.2,
    maxWidth: 300,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },

  // ── Option Cards Container ──
  optionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  // ── Option Card ──
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A547',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },

  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAF8FF',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },

  optionCardGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },

  optionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionIconContainerSelected: {
    backgroundColor: colors.primaryLight,
  },

  optionTextContainer: {
    flex: 1,
  },

  optionTitle: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },

  optionTitleSelected: {
    color: colors.primaryDark,
  },

  optionSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },

  // ── Radio indicator ──
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  // ── Conditional Content ──
  conditionalContainer: {
    marginTop: spacing.md,
  },

  conditionalLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // ── Time Picker (Tier 1) ──
  pickerContainer: {
    alignSelf: 'center',
    width: SCREEN_WIDTH - spacing.lg * 2,
    maxWidth: 340,
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

  colonContainer: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: PICKER_HEIGHT,
  },

  colonText: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.pickerItemSelected,
    color: colors.textPrimary,
  },

  wheelColumn: {
    overflow: 'hidden',
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

  // ── Time-of-Day Grid (Tier 2) ──
  todGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },

  todCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    maxWidth: 170,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A547',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },

  todCardSelected: {
    borderColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },

  todGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },

  todSelectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.md - 1,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },

  todEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },

  todLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },

  todLabelSelected: {
    color: colors.primaryDark,
  },

  todSublabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },

  // ── Reassurance Callout (Tier 3) ──
  reassuranceContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A547',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },

  reassuranceGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },

  reassuranceIconRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  reassuranceEmoji: {
    fontSize: 28,
  },

  reassuranceTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  reassuranceText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.bodySmall * 1.6,
    letterSpacing: 0.2,
  },

  reassuranceDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 165, 71, 0.2)',
    marginVertical: spacing.md,
  },

  reassuranceTip: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.caption * 1.5,
    letterSpacing: 0.1,
  },

  // ── CTA Button (matches Screens 01–03 exactly) ──
  ctaContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

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
});
