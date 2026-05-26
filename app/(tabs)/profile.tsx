/**
 * VEYa — You Tab: Profile & Settings 👤
 * User's cosmic identity hub with profile data, chart, stats, subscription, settings.
 * Reads from onboarding store for user data.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
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
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
// Haptics loaded dynamically (Expo Go safe)
async function hapticImpact(style: 'Light' | 'Medium' = 'Light') {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(
      style === 'Light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
  } catch {}
}
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import AnimatedPressable from '@/components/ui/AnimatedPressable';

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
  accentRose: '#E8788A',
  premiumGold: '#C9A84C',
  premiumGoldDark: '#B8923E',
  doGreen: '#4A9D6E',
  danger: '#E8664D',
  cardBorder: 'rgba(212, 165, 71, 0.12)',
  cardShadow: 'rgba(139, 92, 246, 0.08)',
  switchTrack: '#E0D8CC',
  switchTrackActive: 'rgba(139, 92, 246, 0.3)',
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
    display1: 34,
    display2: 28,
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
const CARD_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;


// ─────────────────────────────────────────────────────────────
// MOCK DATA (cosmic placements, stats, subscription)
// ─────────────────────────────────────────────────────────────

const MOCK_COSMIC = {
  bigThree: {
    sun: { sign: 'Scorpio', symbol: '☉' },
    moon: { sign: 'Pisces', symbol: '☽' },
    rising: { sign: 'Leo', symbol: '↑' },
  },
  zodiacEmoji: '♏',
  memberSince: 'February 2026',
  memoryCount: 47,
  stats: [
    { id: 'readings', label: 'Readings', value: '12', icon: '📖' },
    { id: 'journal', label: 'Journal entries', value: '8', icon: '✍️' },
    { id: 'tarot', label: 'Tarot pulls', value: '3', icon: '🃏' },
    { id: 'streak', label: 'Day streak', value: '7', icon: '🔥' },
    { id: 'topic', label: 'Favorite topic', value: 'Love', icon: '💕' },
    { id: 'active', label: 'Most active', value: 'Mornings', icon: '☀️' },
  ],
  subscription: {
    plan: 'free' as const,
    price: '$9.99/month',
    annualPrice: '$79.99/year',
  },
  appVersion: '1.0.0',
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

async function hapticLight() {
  if (Platform.OS === 'ios') await hapticImpact('Light');
}
async function hapticMedium() {
  if (Platform.OS === 'ios') await hapticImpact('Medium');
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Profile Header
// ─────────────────────────────────────────────────────────────

function ProfileHeader({ userName }: { userName: string }) {
  const borderRotate = useSharedValue(0);
  const memoryCounterScale = useSharedValue(0);

  useEffect(() => {
    borderRotate.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1, false
    );
    memoryCounterScale.value = withDelay(800, withSpring(1, { damping: 10, stiffness: 120, mass: 0.8 }));
  }, []);

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${borderRotate.value}deg` }],
  }));

  const memoryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: memoryCounterScale.value }],
    opacity: memoryCounterScale.value,
  }));

  const AVATAR_BORDER_SIZE = 96;

  return (
    <Animated.View entering={FadeIn.duration(800).delay(100)} style={styles.profileHeaderContainer}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Animated.View style={[styles.avatarBorderRing, borderAnimatedStyle]}>
            <Svg width={AVATAR_BORDER_SIZE} height={AVATAR_BORDER_SIZE}>
              <Defs>
                <SvgLinearGradient id="avatarBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.8" />
                  <Stop offset="33%" stopColor={colors.primary} stopOpacity="0.6" />
                  <Stop offset="66%" stopColor={colors.accentRose} stopOpacity="0.5" />
                  <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0.8" />
                </SvgLinearGradient>
              </Defs>
              <Circle
                cx={AVATAR_BORDER_SIZE / 2}
                cy={AVATAR_BORDER_SIZE / 2}
                r={(AVATAR_BORDER_SIZE - 4) / 2}
                stroke="url(#avatarBorderGrad)"
                strokeWidth={2.5}
                fill="none"
                strokeDasharray="8, 4"
              />
            </Svg>
          </Animated.View>
          <View style={styles.avatarCircle}>
            <LinearGradient colors={['#F0E6FF', '#EDE9FE', '#FDF4E3']} style={styles.avatarGradient}>
              <Text style={styles.avatarZodiac}>{MOCK_COSMIC.zodiacEmoji}</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      <Animated.Text entering={FadeInDown.duration(500).delay(300)} style={styles.profileName}>
        {userName || 'Cosmic Soul'}
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.bigThreeRow}>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>{MOCK_COSMIC.bigThree.sun.symbol}</Text>
          <Text style={styles.bigThreeSign}>{MOCK_COSMIC.bigThree.sun.sign}</Text>
        </View>
        <Text style={styles.bigThreeSeparator}>·</Text>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>{MOCK_COSMIC.bigThree.moon.symbol}</Text>
          <Text style={styles.bigThreeSign}>{MOCK_COSMIC.bigThree.moon.sign}</Text>
        </View>
        <Text style={styles.bigThreeSeparator}>·</Text>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>{MOCK_COSMIC.bigThree.rising.symbol}</Text>
          <Text style={styles.bigThreeSign}>{MOCK_COSMIC.bigThree.rising.sign}</Text>
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(400).delay(500)} style={styles.memberSince}>
        Member since {MOCK_COSMIC.memberSince}
      </Animated.Text>

      <Animated.View style={[styles.memoryCounterBadge, memoryAnimatedStyle]}>
        <Text style={styles.memoryCounterText}>
          ✨ VEYa knows {MOCK_COSMIC.memoryCount} things about your journey
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Cosmic Stats Card
// ─────────────────────────────────────────────────────────────

function CosmicStatsCard() {
  return (
    <Animated.View entering={FadeInDown.duration(600).delay(600)}>
      <View style={[styles.card, styles.statsCard]}>
        <Text style={styles.statsTitle}>Your Cosmic Stats</Text>
        <View style={styles.statsGrid}>
          {MOCK_COSMIC.stats.map((stat, index) => (
            <Animated.View key={stat.id} entering={FadeInDown.duration(400).delay(700 + index * 80)} style={styles.statItem}>
              <View style={styles.statIconCircle}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: My Chart Summary
// ─────────────────────────────────────────────────────────────

function MyChartSummary({ birthDate, birthPlace }: { birthDate: string | null; birthPlace: string }) {
  const displayDate = birthDate ? new Date(birthDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set';
  const displayPlace = birthPlace || 'Not set';

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(900)}>
      <View style={[styles.card, styles.chartCard]}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>My Chart</Text>
          <Pressable onPress={() => hapticLight()} style={styles.editLink}>
            <Text style={styles.editLinkText}>Edit birth data →</Text>
          </Pressable>
        </View>

        <View style={styles.chartPlacements}>
          {[
            { symbol: '☉', label: 'Sun', sign: MOCK_COSMIC.bigThree.sun.sign },
            { symbol: '☽', label: 'Moon', sign: MOCK_COSMIC.bigThree.moon.sign },
            { symbol: '↑', label: 'Rising', sign: MOCK_COSMIC.bigThree.rising.sign },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={styles.chartPlacementDivider} />}
              <View style={styles.chartPlacementRow}>
                <Text style={styles.chartPlacementSymbol}>{item.symbol}</Text>
                <Text style={styles.chartPlacementLabel}>{item.label}</Text>
                <Text style={styles.chartPlacementSign}>{item.sign}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.chartBirthData}>
          <View style={styles.chartBirthRow}>
            <Text style={styles.chartBirthLabel}>Born</Text>
            <Text style={styles.chartBirthValue}>{displayDate}</Text>
          </View>
          <View style={styles.chartBirthRow}>
            <Text style={styles.chartBirthLabel}>Place</Text>
            <Text style={styles.chartBirthValue}>{displayPlace}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Subscription Card
// ─────────────────────────────────────────────────────────────

function SubscriptionCard() {
  const ctaScale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);

  const handleUpgradePress = async () => {
    await hapticMedium();
    ctaScale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  };

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.85, 1]),
  }));

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1100)}>
      <Animated.View style={[styles.card, styles.subscriptionCard, shimmerStyle]}>
        <LinearGradient
          colors={['rgba(212, 165, 71, 0.3)', 'rgba(139, 92, 246, 0.15)', 'rgba(212, 165, 71, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.subscriptionGradientStrip}
        />
        <View style={styles.subscriptionContent}>
          <View style={styles.subscriptionHeader}>
            <View>
              <Text style={styles.subscriptionUpgradeTitle}>Unlock VEYa's Full Potential ✨</Text>
              <Text style={styles.subscriptionUpgradeSubtitle}>Your cosmic journey awaits</Text>
            </View>
            <View style={styles.planBadgeFree}>
              <Text style={styles.planBadgeFreeText}>Free</Text>
            </View>
          </View>

          <View style={styles.benefitsList}>
            {[
              { icon: '💬', text: 'Unlimited AI conversations' },
              { icon: '🎙️', text: 'Voice AI with VEYa' },
              { icon: '🧠', text: 'RAG Memory — VEYa remembers you' },
              { icon: '💕', text: 'Full compatibility readings' },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{MOCK_COSMIC.subscription.price}</Text>
            <Text style={styles.priceAnnual}>or {MOCK_COSMIC.subscription.annualPrice} (save 33%)</Text>
          </View>

          <AnimatedPressable onPress={handleUpgradePress} style={[styles.upgradeButton, ctaAnimatedStyle]}>
            <LinearGradient
              colors={[colors.accentGold, colors.premiumGoldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeButtonGradient}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Settings Section
// ─────────────────────────────────────────────────────────────

function SettingsSection({ focusAreas }: { focusAreas: string[] }) {
  const [notifications, setNotifications] = React.useState(true);
  const [autoSpeak, setAutoSpeak] = React.useState(false);
  const [houseSystem, setHouseSystem] = React.useState<'placidus' | 'whole-sign'>('placidus');

  const displayFocusAreas = focusAreas.length > 0 ? focusAreas.join(', ') : 'Love & Relationships, Career, Personal Growth';

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1300)} style={styles.settingsSection}>
      <Text style={styles.settingsSectionTitle}>Settings</Text>

      <View style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🔔</Text>
            <View>
              <Text style={styles.settingsRowLabel}>Notifications</Text>
              <Text style={styles.settingsRowHint}>Daily briefings & transit alerts</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={(v) => { hapticLight(); setNotifications(v); }}
            trackColor={{ false: colors.switchTrack, true: colors.switchTrackActive }}
            thumbColor={notifications ? colors.primary : colors.white}
            ios_backgroundColor={colors.switchTrack}
          />
        </View>

        <View style={styles.settingsDivider} />

        <Pressable onPress={() => { hapticLight(); setHouseSystem(h => h === 'placidus' ? 'whole-sign' : 'placidus'); }} style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🏛️</Text>
            <View>
              <Text style={styles.settingsRowLabel}>House System</Text>
              <Text style={styles.settingsRowHint}>Currently: {houseSystem === 'placidus' ? 'Placidus' : 'Whole Sign'}</Text>
            </View>
          </View>
          <View style={styles.houseSystemToggle}>
            <Text style={[styles.houseSystemOption, houseSystem === 'placidus' && styles.houseSystemOptionActive]}>Placidus</Text>
            <Text style={[styles.houseSystemOption, houseSystem === 'whole-sign' && styles.houseSystemOptionActive]}>Whole Sign</Text>
          </View>
        </Pressable>

        <View style={styles.settingsDivider} />

        <Pressable onPress={() => hapticLight()} style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🎯</Text>
            <View>
              <Text style={styles.settingsRowLabel}>Focus Areas</Text>
              <Text style={styles.settingsRowHint}>{displayFocusAreas}</Text>
            </View>
          </View>
          <Text style={styles.settingsRowChevron}>›</Text>
        </Pressable>

        <View style={styles.settingsDivider} />

        <View style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🎙️</Text>
            <View>
              <Text style={styles.settingsRowLabel}>VEYa's Voice: Nova ✨</Text>
              <Text style={styles.settingsRowHint}>Auto-speak responses</Text>
            </View>
          </View>
          <Switch
            value={autoSpeak}
            onValueChange={(v) => { hapticLight(); setAutoSpeak(v); }}
            trackColor={{ false: colors.switchTrack, true: colors.switchTrackActive }}
            thumbColor={autoSpeak ? colors.primary : colors.white}
            ios_backgroundColor={colors.switchTrack}
          />
        </View>

        <View style={styles.settingsDivider} />

        <View style={[styles.settingsRow, { opacity: 0.7 }]}>
          <View style={styles.settingsRowLeft}>
            <Text style={[styles.settingsRowIcon, { opacity: 0.4 }]}>🌗</Text>
            <View>
              <Text style={[styles.settingsRowLabel, { opacity: 0.4 }]}>Dark Mode</Text>
              <Text style={[styles.settingsRowHint, { fontStyle: 'italic' }]}>Coming soon</Text>
            </View>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </View>
      </View>

      <View style={[styles.settingsCard, { marginTop: spacing.md }]}>
        {[
          { icon: '🔒', label: 'Privacy Policy' },
          { icon: '📜', label: 'Terms of Service' },
          { icon: '💬', label: 'Support' },
        ].map((link, index) => (
          <React.Fragment key={link.label}>
            {index > 0 && <View style={styles.settingsDivider} />}
            <Pressable onPress={() => hapticLight()} style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Text style={styles.settingsRowIcon}>{link.icon}</Text>
                <Text style={styles.settingsRowLabel}>{link.label}</Text>
              </View>
              <Text style={styles.settingsRowChevron}>›</Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>

      <Pressable onPress={() => hapticMedium()} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
      <Text style={styles.appVersion}>VEYa v{MOCK_COSMIC.appVersion}</Text>
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
  const tones = ['rgba(212, 165, 71, 0.3)', 'rgba(139, 92, 246, 0.15)', 'rgba(232, 120, 138, 0.12)'];
  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH, cy: Math.random() * 200,
      r: Math.random() * 1.4 + 0.4, opacity: Math.random() * 0.2 + 0.05,
      delay: Math.random() * 4000, duration: Math.random() * 8000 + 6000,
      driftX: (Math.random() - 0.5) * 15, driftY: (Math.random() - 0.5) * 10,
      color: tones[Math.floor(Math.random() * tones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(8);

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
// MAIN: ProfileScreen
// ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();

  // Use onboarding store data with fallbacks
  const userName = data.name || 'Cosmic Soul';
  const birthDate = data.birthDate ? String(data.birthDate) : null;
  const birthPlace = data.birthPlace || '';
  const focusAreas = data.focusAreas || [];

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
        <ProfileHeader userName={userName} />
        <CosmicStatsCard />
        <MyChartSummary birthDate={birthDate} birthPlace={birthPlace} />
        {/* SubscriptionCard hidden — all features unlocked */}
        <SettingsSection focusAreas={focusAreas} />
        <View style={{ height: 40 }} />
      </ScrollView>
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

  // Profile Header
  profileHeaderContainer: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
  avatarSection: { marginBottom: spacing.md },
  avatarContainer: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  avatarBorderRing: { position: 'absolute' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  avatarGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarZodiac: { fontSize: 36 },
  profileName: {
    fontFamily: typography.fonts.display, fontSize: typography.sizes.display1, color: colors.textPrimary,
    letterSpacing: 0.3, marginBottom: spacing.sm,
    ...Platform.select({
      ios: { textShadowColor: 'rgba(212, 165, 71, 0.08)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
      android: {},
    }),
  },
  bigThreeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  bigThreeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bigThreeSymbol: { fontFamily: typography.fonts.body, fontSize: typography.sizes.body, color: colors.primary },
  bigThreeSign: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, letterSpacing: 0.2 },
  bigThreeSeparator: { fontFamily: typography.fonts.body, fontSize: typography.sizes.body, color: colors.textMuted, marginHorizontal: spacing.xs },
  memberSince: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted, marginBottom: spacing.sm },
  memoryCounterBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)' },
  memoryCounterText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.primary, letterSpacing: 0.2 },

  // Card base
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.cardBorder,
    ...Platform.select({
      ios: { shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },

  // Stats
  statsCard: { padding: spacing.lg, marginBottom: spacing.md },
  statsTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statItem: { width: (CARD_WIDTH - spacing.lg * 2 - spacing.xs * 2) / 3, alignItems: 'center', paddingVertical: spacing.sm },
  statIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statIcon: { fontSize: 18 },
  statValue: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, marginBottom: 2 },
  statLabel: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, textAlign: 'center', lineHeight: 14.3 },

  // Chart
  chartCard: { padding: spacing.lg, marginBottom: spacing.md },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  chartTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2 },
  editLink: { paddingVertical: 4, paddingHorizontal: spacing.xs },
  editLinkText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.primary, letterSpacing: 0.2 },
  chartPlacements: { backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  chartPlacementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  chartPlacementSymbol: { fontFamily: typography.fonts.body, fontSize: typography.sizes.heading3, color: colors.primary, width: 28, textAlign: 'center' },
  chartPlacementLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
  chartPlacementSign: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, letterSpacing: 0.2 },
  chartPlacementDivider: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.04)', marginLeft: 40 },
  chartBirthData: { gap: spacing.xs },
  chartBirthRow: { flexDirection: 'row', alignItems: 'center' },
  chartBirthLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.textMuted, width: 44 },
  chartBirthValue: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textSecondary, flex: 1 },

  // Subscription
  subscriptionCard: { marginBottom: spacing.md, overflow: 'hidden' },
  subscriptionGradientStrip: { height: 3, width: '100%' },
  subscriptionContent: { padding: spacing.lg },
  subscriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  subscriptionUpgradeTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2, marginBottom: 2 },
  subscriptionUpgradeSubtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted },
  planBadgeFree: { backgroundColor: colors.surface, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.surfaceAlt },
  planBadgeFreeText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny, color: colors.textMuted, letterSpacing: 0.3 },
  benefitsList: { marginBottom: spacing.md, gap: spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitIcon: { fontSize: 16, marginRight: spacing.sm, width: 24, textAlign: 'center' },
  benefitText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, lineHeight: 19.6 },
  priceRow: { alignItems: 'center', marginBottom: spacing.md },
  priceAmount: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading2, color: colors.textPrimary, marginBottom: 2 },
  priceAnnual: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted },
  upgradeButton: { borderRadius: borderRadius.full, overflow: 'hidden' },
  upgradeButtonGradient: { paddingVertical: spacing.md, borderRadius: borderRadius.full, alignItems: 'center' },
  upgradeButtonText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.body, color: colors.white, letterSpacing: 0.5 },

  // Settings
  settingsSection: { marginBottom: spacing.md },
  settingsSectionTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2, marginBottom: spacing.sm },
  settingsCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 56 },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  settingsRowIcon: { fontSize: 18, marginRight: spacing.sm, width: 24, textAlign: 'center' },
  settingsRowLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, letterSpacing: 0.1 },
  settingsRowHint: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, marginTop: 1 },
  settingsRowChevron: { fontFamily: typography.fonts.body, fontSize: 22, color: colors.textMuted },
  settingsDivider: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.04)', marginLeft: spacing.lg + 24 + spacing.sm },
  houseSystemToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: 2 },
  houseSystemOption: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.tiny, color: colors.textMuted, paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: borderRadius.sm - 2, overflow: 'hidden' },
  houseSystemOptionActive: {
    backgroundColor: colors.white, color: colors.primary, fontFamily: typography.fonts.bodySemiBold,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  comingSoonBadge: { backgroundColor: colors.surface, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.full },
  comingSoonText: { fontFamily: typography.fonts.bodyMedium, fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  signOutButton: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.lg },
  signOutText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.danger, letterSpacing: 0.2 },
  appVersion: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
});
