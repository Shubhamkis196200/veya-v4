// ============================================================================
// VEYa Voice Service — Recording + Transcription + TTS (AWS Backend)
// ============================================================================

import { Audio } from 'expo-av';
import { cacheDirectory, EncodingType, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://58to1i483l.execute-api.us-east-1.amazonaws.com';

let currentSound: Audio.Sound | null = null;
let isRecording = false;
let isTranscribing = false;
let isSpeaking = false;

export function getVoiceState() {
  return { isRecording, isTranscribing, isSpeaking };
}

export async function startRecording(): Promise<Audio.Recording> {
  try {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Microphone permission not granted');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    isRecording = true;
    return recording;
  } catch (error) {
    isRecording = false;
    throw error;
  }
}

export async function stopRecording(recording: Audio.Recording): Promise<string> {
  await recording.stopAndUnloadAsync();
  isRecording = false;
  const uri = recording.getURI();
  if (!uri) {
    throw new Error('Failed to capture audio recording');
  }
  return uri;
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  isTranscribing = true;
  try {
    const token = await AsyncStorage.getItem('veya_auth_token');

    // Read file as base64 and send to our backend
    const base64Audio = await readAsStringAsync(audioUri, {
      encoding: EncodingType.Base64,
    });

    const filename = audioUri.split('/').pop() || `recording-${Date.now()}.m4a`;

    const response = await fetch(`${API_BASE}/voice/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
      },
      body: JSON.stringify({
        audio_base64: base64Audio,
        filename,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Transcription error ${response.status}: ${errorBody}`);
    }

    const data = await response.json() as { text?: string };
    return data.text?.trim() || '';
  } finally {
    isTranscribing = false;
  }
}

export async function speakText(text: string, _language?: string): Promise<void> {
  if (!text.trim()) return;

  isSpeaking = true;

  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const token = await AsyncStorage.getItem('veya_auth_token');

    // Call our TTS endpoint which returns base64 audio
    const response = await fetch(`${API_BASE}/voice/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
      },
      body: JSON.stringify({ text, voice: 'nova' }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`TTS error ${response.status}: ${errorBody}`);
    }

    const data = await response.json() as { audio_base64: string; format: string };

    // Save to file and play
    const fileUri = `${cacheDirectory}veya_tts_${Date.now()}.mp3`;
    await writeAsStringAsync(fileUri, data.audio_base64, {
      encoding: EncodingType.Base64,
    });

    const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true });
    currentSound = sound;

    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          resolve();
        }
      });
    });

    await sound.unloadAsync();
    currentSound = null;
  } finally {
    isSpeaking = false;
  }
}

export async function stopSpeaking(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
  isSpeaking = false;
}
