import { Accent, VoiceGender } from '../types';

/**
 * Browser TTS is a live playback fallback only.
 *
 * IMPORTANT: SpeechSynthesis does not expose the synthesized audio bytes to the
 * page, so we must never fabricate an MP3/WAV file and present it as the real
 * narration. Gemini-generated audio is the only downloadable file source.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length === 0) cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

export interface VoiceProfileConfig {
  id: string;
  preferredKeywords: string[];
  fallbackKeywords: string[];
  pitch: number;
  rateModifier: number;
}

export const VOICE_PROFILES: Record<string, VoiceProfileConfig> = {
  'am-male-morgan': { id: 'am-male-morgan', preferredKeywords: ['david', 'guy', 'christopher', 'alex', 'richard', 'mark', 'fred'], fallbackKeywords: ['male'], pitch: 0.58, rateModifier: 0.88 },
  'am-male-david': { id: 'am-male-david', preferredKeywords: ['david', 'guy', 'christopher', 'alex', 'richard', 'mark', 'fred'], fallbackKeywords: ['male'], pitch: 0.72, rateModifier: 0.99 },
  'am-male-marcus': { id: 'am-male-marcus', preferredKeywords: ['mark', 'daniel', 'david', 'guy'], fallbackKeywords: ['male'], pitch: 0.85, rateModifier: 1.03 },
  'am-male-wyatt': { id: 'am-male-wyatt', preferredKeywords: ['guy', 'steffan', 'david', 'roger', 'mark', 'fred', 'alex'], fallbackKeywords: ['male'], pitch: 0.76, rateModifier: 0.92 },
  'am-male-caleb': { id: 'am-male-caleb', preferredKeywords: ['eric', 'roger', 'fred', 'ryan', 'tom', 'aaron'], fallbackKeywords: ['male'], pitch: 1.05, rateModifier: 1.16 },
  'am-female-claire': { id: 'am-female-claire', preferredKeywords: ['zira', 'jenny', 'serena', 'samantha', 'google us english'], fallbackKeywords: ['female', 'us english'], pitch: 0.96, rateModifier: 1.0 },
  'am-female-ava': { id: 'am-female-ava', preferredKeywords: ['aria', 'samantha', 'susan', 'veena', 'google us english'], fallbackKeywords: ['female', 'us english'], pitch: 0.86, rateModifier: 0.95 },
  'am-female-emma': { id: 'am-female-emma', preferredKeywords: ['michelle', 'victoria', 'karen', 'tessa', 'fiona'], fallbackKeywords: ['female', 'us english'], pitch: 1.22, rateModifier: 1.11 },
  'br-male-jarvis': { id: 'br-male-jarvis', preferredKeywords: ['google uk english male', 'george', 'daniel', 'oliver', 'en-gb'], fallbackKeywords: ['uk english male', 'english male', 'male'], pitch: 0.88, rateModifier: 0.97 },
  'br-male-mark': { id: 'br-male-mark', preferredKeywords: ['google uk english male', 'george', 'daniel', 'oliver', 'en-gb'], fallbackKeywords: ['uk english male', 'english male', 'male'], pitch: 0.82, rateModifier: 0.99 },
  'br-male-arthur': { id: 'br-male-arthur', preferredKeywords: ['google uk english male', 'george', 'daniel', 'en-gb', 'oliver'], fallbackKeywords: ['uk english male', 'english male', 'male'], pitch: 0.68, rateModifier: 0.92 },
  'br-male-oliver': { id: 'br-male-oliver', preferredKeywords: ['google uk english male', 'steffan', 'guy', 'christopher', 'alex', 'en-gb'], fallbackKeywords: ['uk english male', 'english male', 'male'], pitch: 0.95, rateModifier: 1.20 },
  'br-female-eleanor': { id: 'br-female-eleanor', preferredKeywords: ['google uk english female', 'hazel', 'victoria', 'serena', 'sonia', 'en-gb'], fallbackKeywords: ['uk english female', 'female'], pitch: 0.94, rateModifier: 0.97 },
  'br-female-charlotte': { id: 'br-female-charlotte', preferredKeywords: ['google uk english female', 'stephanie', 'alice', 'catherine', 'en-gb'], fallbackKeywords: ['uk english female', 'female'], pitch: 1.18, rateModifier: 1.09 },
};

function isDisallowedForMale(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes('female') || n.includes('woman') || n.includes('girl') || n.includes('hazel') ||
    n.includes('susan') || n.includes('zira') || n.includes('samantha') || n.includes('victoria') ||
    n.includes('jenny') || n.includes('aria') || n.includes('kore') || n.includes('zephyr') ||
    n.includes('aoede') || n.includes('sonia') || n.includes('stephanie') || n.includes('karen') ||
    n.includes('tessa') || n.includes('fiona') || n.includes('ava') || n.includes('claire') ||
    n.includes('emma') || n.includes('eleanor') || n.includes('charlotte') || n.includes('catherine') ||
    n.includes('alice') || n.includes('serena') || n.includes('michelle') || n.includes('libby');
}

function isDisallowedForFemale(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes('male') || n.includes('man') || n.includes('boy') || n.includes('guy') ||
    n.includes('david') || n.includes('george') || n.includes('daniel') || n.includes('oliver') ||
    n.includes('mark') || n.includes('alex') || n.includes('steffan') || n.includes('roger') ||
    n.includes('eric') || n.includes('charon') || n.includes('fenrir') || n.includes('puck') ||
    n.includes('arthur') || n.includes('marcus') || n.includes('wyatt') || n.includes('caleb') ||
    n.includes('richard') || n.includes('tom') || n.includes('ryan') || n.includes('aaron') ||
    n.includes('junior') || n.includes('fred');
}

export function getVoiceProfile(voiceIdOrName?: string, accent: Accent = 'american', gender: VoiceGender = 'male'): VoiceProfileConfig {
  if (voiceIdOrName) {
    const directKey = voiceIdOrName.toLowerCase();
    if (VOICE_PROFILES[directKey]) return VOICE_PROFILES[directKey];
    for (const key of Object.keys(VOICE_PROFILES)) {
      const namePart = key.split('-')[2];
      if (namePart && directKey.includes(namePart)) return VOICE_PROFILES[key];
    }
  }

  const defaultKey = `${accent === 'british' ? 'br' : 'am'}-${gender}-${gender === 'male'
    ? accent === 'british' ? 'arthur' : 'david'
    : accent === 'british' ? 'eleanor' : 'claire'}`;
  return VOICE_PROFILES[defaultKey] || VOICE_PROFILES['am-male-david'];
}

export function findBestVoice(accent: Accent, gender: VoiceGender, voiceIdOrName?: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  const profile = getVoiceProfile(voiceIdOrName, accent, gender);
  const accentMatch = (voice: SpeechSynthesisVoice) => {
    const lang = (voice.lang || '').toLowerCase();
    return accent === 'british'
      ? lang.includes('gb') || lang.includes('uk') || lang.includes('en_gb')
      : lang.includes('us') || lang.includes('en-us') || lang.includes('en_us') || lang === 'en';
  };
  const genderMatch = (voice: SpeechSynthesisVoice) =>
    gender === 'male' ? !isDisallowedForMale(voice.name.toLowerCase()) : !isDisallowedForFemale(voice.name.toLowerCase());

  for (const keyword of profile.preferredKeywords) {
    const match = voices.find((voice) => accentMatch(voice) && genderMatch(voice) && voice.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  for (const keyword of profile.preferredKeywords) {
    const match = voices.find((voice) => (voice.lang || '').toLowerCase().startsWith('en') && genderMatch(voice) && voice.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  for (const keyword of profile.fallbackKeywords) {
    const match = voices.find((voice) => accentMatch(voice) && genderMatch(voice) && voice.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  return voices.find((voice) => accentMatch(voice) && genderMatch(voice)) ||
    voices.find((voice) => (voice.lang || '').toLowerCase().startsWith('en') && genderMatch(voice)) ||
    voices.find((voice) => accentMatch(voice)) || voices[0] || null;
}

/**
 * Live browser SpeechSynthesis is not downloadable. This function intentionally
 * returns a marker instead of generating fake PCM/MP3 data. AudioPlayer sees
 * isClientFallback=true and uses playLiveBrowserSpeech() for playback.
 */
export async function generateClientSpeechAudio(
  text: string,
  accent: Accent,
  gender: VoiceGender,
  signal?: AbortSignal
): Promise<{ audioUrl: string; audioBase64: string; duration: number }> {
  if (signal?.aborted) throw new DOMException('Speech generation cancelled', 'AbortError');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const duration = Math.max(3, Math.round((words / 140) * 60));
  return {
    audioUrl: 'browser-tts://live-only',
    audioBase64: '',
    duration,
  };
}

let activeSentenceQueue: string[] = [];
let currentQueueIndex = 0;
let isQueueRunning = false;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let activeProgressCallback: ((index: number, total: number) => void) | null = null;
let currentActiveUtterance: SpeechSynthesisUtterance | null = null;
let liveSpeechEndHandler: (() => void) | null = null;
let activeSpeechVolume = 0.85;
let restartCurrentUtterance: (() => void) | null = null;

export function setLiveBrowserSpeechVolume(vol: number): void {
  const nextVolume = Math.max(0, Math.min(1, vol));
  const changed = nextVolume !== activeSpeechVolume;
  activeSpeechVolume = nextVolume;
  if (currentActiveUtterance) currentActiveUtterance.volume = activeSpeechVolume;
  if (changed && isQueueRunning && restartCurrentUtterance) restartCurrentUtterance();
}

export function getLiveBrowserSpeechVolume(): number {
  return activeSpeechVolume;
}

function splitIntoNarrationSentences(rawText: string): string[] {
  const clean = rawText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const rawMatches = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  const result: string[] = [];

  for (const sentence of rawMatches) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 140) {
      result.push(trimmed);
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 120) {
        if (current.trim()) result.push(current.trim());
        current = word;
      } else {
        current += (current ? ' ' : '') + word;
      }
    }
    if (current.trim()) result.push(current.trim());
  }
  return result;
}

export function playLiveBrowserSpeech(
  text: string,
  accent: Accent,
  gender: VoiceGender,
  rate = 1.0,
  onEnd?: () => void,
  preferredNarrator?: string,
  startIndex = 0,
  onProgress?: (index: number, total: number) => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  stopLiveBrowserSpeech();

  const sentences = splitIntoNarrationSentences(text);
  if (sentences.length === 0) {
    onEnd?.();
    return;
  }

  activeSentenceQueue = sentences;
  currentQueueIndex = Math.max(0, Math.min(startIndex, sentences.length - 1));
  isQueueRunning = true;
  liveSpeechEndHandler = onEnd || null;
  activeProgressCallback = onProgress || null;

  const profile = getVoiceProfile(preferredNarrator, accent, gender);
  const matchedVoice = findBestVoice(accent, gender, preferredNarrator);
  const effectiveLang = accent === 'british' ? 'en-GB' : 'en-US';
  const effectiveRate = Math.max(0.6, Math.min(2.0, rate * profile.rateModifier));

  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    if (window.speechSynthesis.speaking && isQueueRunning) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 6000);

  const speakNext = () => {
    if (!isQueueRunning) return;
    if (currentQueueIndex >= activeSentenceQueue.length) {
      const callback = liveSpeechEndHandler;
      isQueueRunning = false;
      stopLiveBrowserSpeech();
      callback?.();
      return;
    }

    const sentence = activeSentenceQueue[currentQueueIndex];
    activeProgressCallback?.(currentQueueIndex, activeSentenceQueue.length);
    const utterance = new SpeechSynthesisUtterance(sentence);
    currentActiveUtterance = utterance;
    if (matchedVoice) utterance.voice = matchedVoice;
    utterance.lang = effectiveLang;
    utterance.pitch = profile.pitch;
    utterance.rate = effectiveRate;
    utterance.volume = activeSpeechVolume;

    utterance.onend = () => {
      if (isQueueRunning) {
        currentQueueIndex += 1;
        speakNext();
      }
    };
    utterance.onerror = (event) => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') console.warn('Speech queue chunk error:', event.error);
      if (isQueueRunning) {
        currentQueueIndex += 1;
        speakNext();
      }
    };

    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  };

  restartCurrentUtterance = () => {
    if (!isQueueRunning || !currentActiveUtterance) return;
    currentActiveUtterance.onend = null;
    currentActiveUtterance.onerror = null;
    window.speechSynthesis.cancel();
    currentActiveUtterance = null;
    speakNext();
  };

  speakNext();
}

export function seekLiveBrowserSpeech(
  percentage: number,
  text: string,
  accent: Accent,
  gender: VoiceGender,
  rate = 1.0,
  onEnd?: () => void,
  preferredNarrator?: string
): void {
  const sentences = splitIntoNarrationSentences(text);
  if (sentences.length === 0) return;
  const targetIndex = Math.floor(Math.max(0, Math.min(0.99, percentage)) * sentences.length);
  playLiveBrowserSpeech(text, accent, gender, rate, onEnd, preferredNarrator, targetIndex);
}

export function stopLiveBrowserSpeech(): void {
  isQueueRunning = false;
  activeSentenceQueue = [];
  currentQueueIndex = 0;
  activeProgressCallback = null;
  restartCurrentUtterance = null;

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    liveSpeechEndHandler = null;
    if (currentActiveUtterance) {
      currentActiveUtterance.onend = null;
      currentActiveUtterance.onerror = null;
      currentActiveUtterance = null;
    }
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
    } catch {
      // Ignore browser speech engine cleanup errors.
    }
  }
}
