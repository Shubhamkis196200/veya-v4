import type { RefObject } from 'react';
import * as Sharing from 'expo-sharing';
import type ViewShot from 'react-native-view-shot';
import type { GeneratedDailyReading } from './dailyReadingGenerator';

export interface ShareCardData {
  title: string;
  body: string;
  signName: string;
  date: string;
}

function formatDate(dateString?: string) {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function captureAndShare(
  viewRef: RefObject<ViewShot | null>,
): Promise<boolean> {
  try {
    const uri = await viewRef.current?.capture?.();

    if (!uri) return false;

    const available = await Sharing.isAvailableAsync();
    if (!available) return false;

    await Sharing.shareAsync(uri);
    return true;
  } catch (error) {
    console.error('[ShareService] captureAndShare error:', error);
    return false;
  }
}

export function shareReading(
  reading: GeneratedDailyReading,
  signName: string,
): ShareCardData {
  return {
    title: `Your ${signName} Cosmic Briefing`,
    body: reading.briefing,
    signName,
    date: formatDate(reading.date),
  };
}

export function shareChatResponse(
  message: string,
  signName: string,
): ShareCardData {
  return {
    title: `Cosmic Insight for ${signName}`,
    body: message,
    signName,
    date: formatDate(),
  };
}
