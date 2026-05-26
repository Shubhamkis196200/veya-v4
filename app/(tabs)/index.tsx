/**
 * VEYa — Today Tab (Home) — SAFE VERSION
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import ViewShot from 'react-native-view-shot';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useReadingStore } from '@/stores/readingStore';
import { useStreakStore } from '@/stores/streakStore';
import type { ZodiacSign } from '@/types';
import EnergyMeter from '@/components/home/EnergyMeter';
import DailyBriefingCard from '@/components/home/DailyBriefingCard';
import DoAndDontCard from '@/components/home/DoAndDontCard';
import TransitHighlights from '@/components/home/TransitHighlights';
import StreakCounter from '@/components/home/StreakCounter';
import ShareableCard from '@/components/shared/ShareableCard';
import { captureAndShare, shareReading } from '@/services/shareService';
import VoiceInterface from '@/components/voice/VoiceInterface';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Quiet hours';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Sweet night';
}

function getDateDisplay(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();
  const { generatedReading, ensureGeneratedReading, isLoading: readingLoading } = useReadingStore();
  const { currentStreak, isLoading: streakLoading, performCheckIn, loadStreak } = useStreakStore();

  const [showVoice, setShowVoice] = useState(false);
  const shareRef = React.useRef<ViewShot | null>(null);

  const demoUserId = 'demo-user-001';
  const sunSign: ZodiacSign = (data?.sunSign as ZodiacSign) || 'Scorpio';

  useEffect(() => {
    (async () => {
      try {
        await ensureGeneratedReading(sunSign);
      } catch (e) {
        console.warn('[Reading] error', e);
      }
    })();
  }, [ensureGeneratedReading, sunSign]);

  useEffect(() => {
    (async () => {
      try {
        await loadStreak(demoUserId);
        await performCheckIn(demoUserId);
      } catch {
        // Silent fail
      }
    })();
  }, [loadStreak, performCheckIn]);

  const greeting = useMemo(() => getGreeting(), []);
  const dateDisplay = useMemo(() => getDateDisplay(), []);
  const r = generatedReading;

  const shareData = useMemo(() => (r ? shareReading(r, sunSign) : null), [r, sunSign]);

  const handleShare = useCallback(async () => {
    if (!shareData) return;
    const success = await captureAndShare(shareRef);
    if (!success) {
      Alert.alert('Share failed', 'Unable to share this card right now. Please try again.');
    }
  }, [shareData]);

  const handleOpenVoice = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Mic needed', 'Please enable microphone access');
        return;
      }
      setShowVoice(true);
    } catch {
      Alert.alert('Mic needed', 'Please enable microphone access');
    }
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <StatusBar style="dark" />
      {shareData && (
        <ViewShot ref={shareRef} style={styles.shareShot}>
          <ShareableCard
            title={shareData.title}
            body={shareData.body}
            signName={shareData.signName}
            date={shareData.date}
          />
        </ViewShot>
      )}
      <Modal visible={showVoice} animationType="slide" presentationStyle="fullScreen">
        <VoiceInterface onClose={() => setShowVoice(false)} />
      </Modal>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <StreakCounter currentStreak={currentStreak} isLoading={streakLoading} />
        </Animated.View>

        {/* Talk to VEYa Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <Pressable onPress={handleOpenVoice} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9', '#5B21B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.talkCard}
          >
            <View style={styles.talkCardContent}>
              <Ionicons name="mic" size={28} color="#FFFFFF" />
              <View style={styles.talkCardText}>
                <Text style={styles.talkCardTitle}>Talk to VEYa ✨</Text>
                <Text style={styles.talkCardSubtitle}>Your AI astrologer is ready to chat</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
        <Text style={styles.greeting}>{greeting}, {data?.name || 'Star Child'} ☉</Text>
        <Text style={styles.subtitle}>{dateDisplay} · {sunSign}</Text>
        </Animated.View>

        {readingLoading && !r && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.loadingText}>Consulting the stars...</Text>
          </View>
        )}

        {r?.moonPhase && (
          <View style={styles.moonBadge}>
            <Text style={styles.moonEmoji}>{r.moonPhase.emoji}</Text>
            <View style={styles.moonTextWrap}>
              <Text style={styles.moonName}>{r.moonPhase.name} · {r.moonPhase.illumination}% illuminated</Text>
              <Text style={styles.moonGuidance}>{r.moonPhase.guidance}</Text>
            </View>
          </View>
        )}

        {r && (
          <View style={styles.card}>
            <EnergyMeter score={r.energyScore} />
          </View>
        )}

        {r?.briefing && (
          <DailyBriefingCard
            briefing={r.briefing}
            onShare={shareData ? handleShare : undefined}
          />
        )}
        {r?.dos && r?.donts && <DoAndDontCard dos={r.dos} donts={r.donts} />}
        {r?.transits && <TransitHighlights transits={r.transits} />}

        {r && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🍀 Lucky Elements</Text>
            <View style={styles.luckyGrid}>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyIcon}>🎨</Text>
                <Text style={styles.luckyLabel}>Color</Text>
                <Text style={styles.luckyValue}>{r.luckyColor}</Text>
              </View>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyIcon}>🔢</Text>
                <Text style={styles.luckyLabel}>Number</Text>
                <Text style={styles.luckyValue}>{r.luckyNumber}</Text>
              </View>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyIcon}>⏰</Text>
                <Text style={styles.luckyLabel}>Time</Text>
                <Text style={styles.luckyValue}>{r.luckyTime}</Text>
              </View>
            </View>
          </View>
        )}

        {r?.compatibility && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💫 Today's Cosmic Allies</Text>
            <Text style={styles.compatText}>Best match: <Text style={styles.compatSign}>{r.compatibility.best}</Text></Text>
            <Text style={styles.compatText}>Rising connection: <Text style={styles.compatSign}>{r.compatibility.rising}</Text></Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  greeting: { fontSize: 26, fontFamily: 'PlayfairDisplay-Bold', color: '#1A1A2E', marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#9B9BAD', marginBottom: 20 },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212,165,71,0.12)' },
  loadingText: { fontSize: 13, fontFamily: 'Inter-Medium', color: '#6B6B80' },
  moonBadge: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(212,165,71,0.08)', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212,165,71,0.15)' },
  moonEmoji: { fontSize: 28, marginRight: 12, marginTop: 2 },
  moonTextWrap: { flex: 1 },
  moonName: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#D4A547', marginBottom: 4 },
  moonGuidance: { fontSize: 13, fontFamily: 'Inter-Regular', color: '#6B6B80', lineHeight: 19 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212,165,71,0.12)', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }, android: { elevation: 2 } }) },
  cardTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#1A1A2E', marginBottom: 12 },
  luckyGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  luckyItem: { alignItems: 'center', flex: 1 },
  luckyIcon: { fontSize: 22, marginBottom: 4 },
  luckyLabel: { fontSize: 11, fontFamily: 'Inter-Regular', color: '#9B9BAD', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  luckyValue: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: '#1A1A2E', textAlign: 'center' },
  compatText: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#6B6B80', marginBottom: 6 },
  compatSign: { fontFamily: 'Inter-SemiBold', color: '#D4A547' },
  talkCard: { borderRadius: 16, padding: 18, marginBottom: 16 },
  talkCardContent: { flexDirection: 'row', alignItems: 'center' },
  talkCardText: { flex: 1, marginLeft: 14 },
  talkCardTitle: { fontSize: 17, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  talkCardSubtitle: { fontSize: 13, fontFamily: 'Inter-Regular', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  shareShot: { position: 'absolute', left: -2000, top: 0, width: 1080, height: 1920 },
});
