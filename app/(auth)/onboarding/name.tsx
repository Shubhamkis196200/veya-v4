/**
 * VEYa — Screen 02: Name Input
 *
 * Collects the user's first name. This is the first personal data entry
 * and sets the intimate, one-on-one tone for the entire app experience.
 *
 * Design direction: Luxury form · Single question per screen ·
 * Premium underline input · Warm and personal, never clinical
 *
 * @module screens/onboarding/name
 * @version 1.0.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
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
  interpolate,
  interpolateColor,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
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
// DESIGN TOKENS (identical to Screen 01 for consistency)
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
// DIMENSIONS
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 9;
const CURRENT_STEP = 1; // 0-indexed: step 1 of 8

// ─────────────────────────────────────────────────────────────
// ANIMATED COMPONENTS
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES (lighter version — fewer for input screen)
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

const PARTICLES = generateParticles(5); // Fewer particles — cleaner for input

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
// PROGRESS INDICATOR
// Minimal dots showing 1 of 8, warm gold for active step
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
// COSMIC SPARKLE ICON
// A small decorative element above the headline — a four-point
// star with gentle radial glow, hinting at the cosmic theme
// without being heavy-handed.
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

        {/* Soft radial glow */}
        <Circle cx="24" cy="24" r="20" fill="url(#sparkleGlow)" />

        {/* Four-point star */}
        <Path
          d="M24 6 L27 20 L42 24 L27 28 L24 42 L21 28 L6 24 L21 20 Z"
          fill={colors.accentGold}
          opacity={0.45}
        />

        {/* Inner star (smaller, brighter) */}
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
// BACK BUTTON
// Subtle chevron in the top-left corner
// ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the welcome screen"
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
// MAIN COMPONENT: NameScreen
// ─────────────────────────────────────────────────────────────

export default function NameScreen() {
  const insets = useSafeAreaInsets();
  const { data, updateData, nextStep } = useOnboardingStore();

  // Local state
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Derived
  const nameValue = data.name || '';
  const isValid = nameValue.trim().length >= 2;
  const showError = hasInteracted && !isValid && nameValue.length > 0;

  // Animation values
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0.4);
  const underlineWidth = useSharedValue(0);
  const underlineColor = useSharedValue(0); // 0 = neutral, 1 = gold

  // ── Auto-focus input on mount ──
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 800); // Delay to let entrance animation complete
    return () => clearTimeout(timer);
  }, []);

  // ── Update button enabled state ──
  useEffect(() => {
    buttonOpacity.value = withTiming(isValid ? 1 : 0.4, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [isValid]);

  // ── Underline animation on focus ──
  useEffect(() => {
    underlineWidth.value = withTiming(isFocused ? 1 : 0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
    underlineColor.value = withTiming(isFocused ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [isFocused]);

  // ── Handlers ──
  const handleBack = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Keyboard.dismiss();
    router.back();
  };

  const handleContinue = async () => {
    if (!isValid) {
      setHasInteracted(true);
      return;
    }

    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Keyboard.dismiss();
    nextStep();
    router.push('/(auth)/onboarding/birth-date');
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

  const handleTextChange = (text: string) => {
    updateData({ name: text });
    if (!hasInteracted && text.length > 0) {
      setHasInteracted(true);
    }
  };

  // ── Animated styles ──
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  const underlineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: underlineWidth.value }],
    backgroundColor: interpolateColor(
      underlineColor.value,
      [0, 1],
      [colors.inputBorder, colors.accentGold]
    ),
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Background gradient (same as Screen 01) ── */}
      <LinearGradient
        colors={['#FDFBF7', '#F8F4EC', '#F5F0E8']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Stardust particles (reduced count) ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <StardustParticle key={i} config={p} />
        ))}
      </View>

      {/* ── Keyboard-aware wrapper ── */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
            {/* Invisible spacer to balance the back button */}
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
            What should we{'\n'}call you?
          </Animated.Text>

          {/* ── Subtext ── */}
          <Animated.Text
            entering={FadeInDown.duration(600).delay(350).easing(Easing.out(Easing.ease))}
            style={styles.subtext}
          >
            This helps VEYa personalize your cosmic experience
          </Animated.Text>

          {/* ── Name input ── */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(450).easing(Easing.out(Easing.ease))}
            style={styles.inputContainer}
          >
            <TextInput
              ref={inputRef}
              value={nameValue}
              onChangeText={handleTextChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Your first name"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
              autoCapitalize="words"
              autoComplete="given-name"
              autoCorrect={false}
              returnKeyType="done"
              maxLength={30}
              onSubmitEditing={handleContinue}
              accessibilityLabel="First name input"
              accessibilityHint="Enter your first name to personalize your experience"
            />

            {/* Underline (static base) */}
            <View style={styles.underlineBase} />

            {/* Underline (animated gold on focus) */}
            <Animated.View
              style={[styles.underlineAnimated, underlineAnimatedStyle]}
            />

            {/* Error message */}
            {showError && (
              <Animated.Text
                entering={FadeIn.duration(300)}
                style={styles.errorText}
              >
                Please enter at least 2 characters
              </Animated.Text>
            )}
          </Animated.View>

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
              accessibilityHint="Proceeds to the next onboarding step"
              accessibilityState={{ disabled: !isValid }}
            >
              <Text style={styles.ctaText}>Continue</Text>
            </AnimatedPressable>
          </Animated.View>

          {/* ── Bottom spacer for keyboard dismiss area ── */}
          <View style={styles.bottomSpacer} />
        </View>
      </KeyboardAvoidingView>
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

  keyboardAvoid: {
    flex: 1,
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
    marginLeft: -spacing.xs, // Optical alignment to edge
  },

  headerSpacer: {
    width: 44, // Matches back button width for centering progress
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
    // Subtle gold glow
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
    flex: 0.12,
  },

  middleSpacer: {
    flex: 1,
    minHeight: spacing.xxl,
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
    // Subtle text shadow for depth (same as Screen 01 logo)
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
    maxWidth: 280,
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },

  // ── Input ──
  inputContainer: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },

  textInput: {
    fontFamily: typography.fonts.displayRegular,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    letterSpacing: 0.5,
    // No border — we use the underline below
  },

  underlineBase: {
    height: 1,
    backgroundColor: colors.inputBorder,
    width: '100%',
  },

  underlineAnimated: {
    height: 2,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    // Transform origin is center by default — scaleX from center
  },

  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.1,
  },

  // ── CTA Button (matches Screen 01 exactly) ──
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
    // Warm glow shadow
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
