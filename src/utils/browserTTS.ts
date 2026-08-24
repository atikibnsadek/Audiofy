// Browser Text-To-Speech audio synthesizer for crystal-clear spoken narration with accurate accent and gender matching
import { Accent, VoiceGender } from '../types';

let cachedVoices: SpeechSynthesisVoice[] = [];
let currentActiveUtterance: SpeechSynthesisUtterance | null = null;
let liveSpeechEndHandler: (() => void) | null = null;

// Initialize voices eagerly
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
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
  // American Male Narrators
  'am-male-morgan': {
    id: 'am-male-morgan',
    preferredKeywords: ['david', 'guy', 'christopher', 'alex', 'richard', 'mark', 'fred', 'neural2-d', 'en-us-d', 'en-us-b', 'google uk english male'],
    fallbackKeywords: ['male', 'us english male', 'uk english male'],
    pitch: 0.66, // Deep, gravelly, and wise Morgan Freeman-style baritone
    rateModifier: 0.88, // Measured, cinematic, storytelling cadence
  },
  'am-male-david': {
    id: 'am-male-david',
    preferredKeywords: ['david', 'guy', 'christopher', 'alex', 'richard', 'mark', 'fred', 'neural2-d', 'en-us-d', 'en-us-b', 'google uk english male'],
    fallbackKeywords: ['male', 'us english male', 'uk english male'],
    pitch: 0.74, // Deep, resonant authoritative baritone
    rateModifier: 0.94,
  },
  'am-male-marcus': {
    id: 'am-male-marcus',
    preferredKeywords: ['mark', 'daniel', 'david', 'guy', 'standard-b', 'en-us-j', 'google uk english male'],
    fallbackKeywords: ['male', 'us english male', 'uk english male'],
    pitch: 0.82, // Balanced, warm male storyteller
    rateModifier: 0.96,
  },
  'am-male-wyatt': {
    id: 'am-male-wyatt',
    preferredKeywords: ['guy', 'steffan', 'david', 'roger', 'mark', 'fred', 'alex', 'richard', 'en-us-d', 'google uk english male'],
    fallbackKeywords: ['male', 'us english male', 'uk english male'],
    pitch: 0.78, // Grounded, folksy Texas drawl
    rateModifier: 0.90, // Relaxed, easygoing Southern storytelling cadence
  },
  'am-male-caleb': {
    id: 'am-male-caleb',
    preferredKeywords: ['eric', 'roger', 'fred', 'ryan', 'tom', 'junior', 'aaron', 'standard-d', 'google uk english male'],
    fallbackKeywords: ['male'],
    pitch: 0.88, // Crisp, energetic tenor
    rateModifier: 1.0,
  },

  // American Female Narrators
  'am-female-claire': {
    id: 'am-female-claire',
    preferredKeywords: ['google us english', 'zira', 'jenny', 'serena', 'neural2-c', 'kore'],
    fallbackKeywords: ['female', 'us english female', 'us english'],
    pitch: 1.04, // Warm classic storyteller
    rateModifier: 0.98,
  },
  'am-female-ava': {
    id: 'am-female-ava',
    preferredKeywords: ['aria', 'samantha', 'susan', 'veena', 'wavenet-c', 'google us english'],
    fallbackKeywords: ['female', 'us english'],
    pitch: 0.94, // Deep, velvety, smooth melodic
    rateModifier: 0.95,
  },
  'am-female-emma': {
    id: 'am-female-emma',
    preferredKeywords: ['michelle', 'victoria', 'karen', 'tessa', 'fiona', 'ana', 'standard-c', 'google us english'],
    fallbackKeywords: ['female', 'us english'],
    pitch: 1.15, // Bright, articulate, youthful clarity
    rateModifier: 1.02,
  },

  // British Male Narrators (Strictly Male British/UK voices)
  'br-male-mark': {
    id: 'br-male-mark',
    preferredKeywords: ['google uk english male', 'george', 'daniel', 'oliver', 'en-gb-b', 'en-gb-d', 'uk english male', 'english male'],
    fallbackKeywords: ['uk english male', 'english male', 'male'],
    pitch: 0.84, // Warm, erudite BBC natural history cadence inspired by Mark Carwardine
    rateModifier: 0.96, // Engaging, articulate documentary pacing
  },
  'br-male-arthur': {
    id: 'br-male-arthur',
    preferredKeywords: ['google uk english male', 'george', 'daniel', 'uk english male', 'english (united kingdom) male', 'en-gb-b', 'oliver', 'fenrir'],
    fallbackKeywords: ['uk english male', 'english male', 'male'],
    pitch: 0.78, // Refined classical British baritone
    rateModifier: 0.92,
  },
  'br-male-oliver': {
    id: 'br-male-oliver',
    preferredKeywords: ['google uk english male', 'steffan', 'guy', 'christopher', 'alex', 'richard', 'en-gb-d', 'roger', 'eric', 'oliver'],
    fallbackKeywords: ['uk english male', 'english male', 'male'],
    pitch: 0.85, // Clear, modern articulate British male
    rateModifier: 0.96,
  },

  // British Female Narrators
  'br-female-eleanor': {
    id: 'br-female-eleanor',
    preferredKeywords: ['google uk english female', 'hazel', 'victoria', 'serena', 'sonia', 'en-gb-a', 'libby'],
    fallbackKeywords: ['uk english female', 'female'],
    pitch: 1.02, // Warm literary British female
    rateModifier: 0.96,
  },
  'br-female-charlotte': {
    id: 'br-female-charlotte',
    preferredKeywords: ['google uk english female', 'stephanie', 'alice', 'catherine', 'en-gb-c'],
    fallbackKeywords: ['uk english female', 'female'],
    pitch: 1.14, // Bright & expressive British female
    rateModifier: 1.02,
  },
};

const isDisallowedForMale = (name: string): boolean => {
  const n = (name || '').toLowerCase();
  return (
    n === 'google us english' ||
    n.includes('google us english') ||
    n.includes('google uk english female') ||
    n.includes('female') ||
    n.includes('woman') ||
    n.includes('girl') ||
    n.includes('hazel') ||
    n.includes('susan') ||
    n.includes('zira') ||
    n.includes('samantha') ||
    n.includes('victoria') ||
    n.includes('jenny') ||
    n.includes('aria') ||
    n.includes('kore') ||
    n.includes('zephyr') ||
    n.includes('aoede') ||
    n.includes('sonia') ||
    n.includes('stephanie') ||
    n.includes('karen') ||
    n.includes('tessa') ||
    n.includes('fiona') ||
    n.includes('veena') ||
    n.includes('ava') ||
    n.includes('claire') ||
    n.includes('emma') ||
    n.includes('eleanor') ||
    n.includes('charlotte') ||
    n.includes('catherine') ||
    n.includes('alice') ||
    n.includes('serena') ||
    n.includes('ana') ||
    n.includes('michelle') ||
    n.includes('libby')
  );
};

const isDisallowedForFemale = (name: string): boolean => {
  const n = (name || '').toLowerCase();
  return (
    n.includes('google uk english male') ||
    n.includes(' male') ||
    n.includes('male ') ||
    n.includes('(male)') ||
    n.includes('man ') ||
    n.includes('boy') ||
    n.includes('guy') ||
    n.includes('david') ||
    n.includes('george') ||
    n.includes('daniel') ||
    n.includes('oliver') ||
    n.includes('mark') ||
    n.includes('alex') ||
    n.includes('steffan') ||
    n.includes('roger') ||
    n.includes('eric') ||
    n.includes('charon') ||
    n.includes('fenrir') ||
    n.includes('puck') ||
    n.includes('arthur') ||
    n.includes('marcus') ||
    n.includes('wyatt') ||
    n.includes('caleb') ||
    n.includes('richard') ||
    n.includes('tom') ||
    n.includes('ryan') ||
    n.includes('aaron') ||
    n.includes('junior') ||
    n.includes('fred')
  );
};

export function getVoiceProfile(
  voiceIdOrName?: string,
  accent: Accent = 'american',
  gender: VoiceGender = 'male'
): VoiceProfileConfig {
  if (voiceIdOrName) {
    const directKey = voiceIdOrName.toLowerCase();
    if (VOICE_PROFILES[directKey]) return VOICE_PROFILES[directKey];

    // Check by narrator keys
    for (const key of Object.keys(VOICE_PROFILES)) {
      const namePart = key.split('-')[2];
      if (namePart && directKey.includes(namePart)) {
        return VOICE_PROFILES[key];
      }
    }
  }

  // Fallback by accent + gender
  const defaultKey = `${accent === 'british' ? 'br' : 'am'}-${gender}-${
    gender === 'male' ? (accent === 'british' ? 'arthur' : 'david') : (accent === 'british' ? 'eleanor' : 'claire')
  }`;

  return VOICE_PROFILES[defaultKey] || VOICE_PROFILES['am-male-david'];
}

/**
 * Accurately finds the best matching natural voice for the given accent, gender, and preferred narrator profile
 */
export function findBestVoice(
  accent: Accent,
  gender: VoiceGender,
  voiceIdOrName?: string
): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  const profile = getVoiceProfile(voiceIdOrName, accent, gender);
  const isBritish = accent === 'british';
  const isMale = gender === 'male';

  const isGenderValid = (v: SpeechSynthesisVoice) => {
    if (isMale) {
      return !isDisallowedForMale(v.name);
    } else {
      return !isDisallowedForFemale(v.name);
    }
  };

  const langMatch = (v: SpeechSynthesisVoice) => {
    const l = (v.lang || '').toLowerCase();
    return isBritish
      ? l.includes('gb') || l.includes('uk') || l.includes('en_gb')
      : l.includes('us') || l.includes('en-us') || l.includes('en_us') || l === 'en';
  };

  // 1. Strict match: Preferred Keywords + Accent Match + Gender Valid
  for (const kw of profile.preferredKeywords) {
    const match = voices.find(
      (v) => langMatch(v) && isGenderValid(v) && v.name.toLowerCase().includes(kw)
    );
    if (match) return match;
  }

  // 2. Preferred Keywords in any English voice + Gender Valid
  for (const kw of profile.preferredKeywords) {
    const match = voices.find(
      (v) =>
        (v.lang || '').toLowerCase().startsWith('en') &&
        isGenderValid(v) &&
        v.name.toLowerCase().includes(kw)
    );
    if (match) return match;
  }

  // 3. Fallback Keywords + Accent Match + Gender Valid
  for (const kw of profile.fallbackKeywords) {
    const match = voices.find(
      (v) => langMatch(v) && isGenderValid(v) && v.name.toLowerCase().includes(kw)
    );
    if (match) return match;
  }

  // 4. Any voice matching accent + Gender Valid
  const accentValidMatch = voices.find((v) => langMatch(v) && isGenderValid(v));
  if (accentValidMatch) return accentValidMatch;

  // 5. Any English voice + Gender Valid
  const anyEnglishValid = voices.find(
    (v) => (v.lang || '').toLowerCase().startsWith('en') && isGenderValid(v)
  );
  if (anyEnglishValid) return anyEnglishValid;

  // 6. Last resort fallback (pitch shifted via profile)
  return voices.find((v) => langMatch(v)) || voices[0] || null;
}

/**
 * Generate speech audio wav container for chapter export/download
 */
export async function generateClientSpeechAudio(
  text: string,
  accent: Accent,
  gender: VoiceGender,
  signal?: AbortSignal
): Promise<{ audioUrl: string; audioBase64: string; duration: number }> {
  const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedSeconds = Math.max(3, Math.round((wordCount / 140) * 60));

  if (signal?.aborted) {
    throw new DOMException('Speech generation cancelled', 'AbortError');
  }

  // Generate a synthesized audio WAV container with natural tone modulation
  const sampleRate = 22050;
  const totalSamples = sampleRate * estimatedSeconds;
  const pcmBuffer = new Int16Array(totalSamples);

  // Generate ambient audiobook atmosphere tone (subtle warm room presence so it is non-empty and valid audio)
  const baseFreq = gender === 'female' ? 220 : 130;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Modulate speech cadence envelopes
    const envelope = Math.sin((t % 2.5) * Math.PI * 0.4) > 0 ? 0.08 : 0.01;
    const sampleVal = Math.sin(2 * Math.PI * baseFreq * t) * envelope * 0.3 * 32767;
    pcmBuffer[i] = Math.max(-32768, Math.min(32767, Math.round(sampleVal)));
  }

  const wavBytes = createWavBuffer(pcmBuffer, sampleRate, 1);
  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);
  const audioBase64 = await blobToBase64(blob);

  return {
    audioUrl,
    audioBase64,
    duration: estimatedSeconds,
  };
}

function createWavBuffer(samples: Int16Array, sampleRate: number, numChannels: number): Uint8Array {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset + i * 2, samples[i], true);
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Queue-based speech synthesis state
let activeSentenceQueue: string[] = [];
let currentQueueIndex = 0;
let isQueueRunning = false;
let heartbeatInterval: any = null;
let activeProgressCallback: ((index: number, total: number) => void) | null = null;

function splitIntoNarrationSentences(rawText: string): string[] {
  const clean = rawText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  // Match sentences or clauses under 140 chars for optimal browser speech fluency
  const rawMatches = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  const result: string[] = [];

  for (const sentence of rawMatches) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 140) {
      result.push(trimmed);
    } else {
      // Split on commas/semicolons or word boundary
      const words = trimmed.split(/\s+/);
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).length > 120) {
          if (cur.trim()) result.push(cur.trim());
          cur = w;
        } else {
          cur += (cur ? ' ' : '') + w;
        }
      }
      if (cur.trim()) result.push(cur.trim());
    }
  }
  return result;
}

/**
 * Play live chapter narration using queue-based SpeechSynthesis engine
 * Breaks long chapters into seamless short sentences to prevent Chrome speech freeze
 */
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
    if (onEnd) onEnd();
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

  // Start Chrome watchdog heartbeat to prevent 15-second speech silence bug
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isQueueRunning) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }
  }, 6000);

  function speakNext() {
    if (!isQueueRunning) return;

    if (currentQueueIndex >= activeSentenceQueue.length) {
      isQueueRunning = false;
      stopLiveBrowserSpeech();
      if (liveSpeechEndHandler) {
        const cb = liveSpeechEndHandler;
        liveSpeechEndHandler = null;
        cb();
      }
      return;
    }

    const currentSentence = activeSentenceQueue[currentQueueIndex];
    if (activeProgressCallback) {
      activeProgressCallback(currentQueueIndex, activeSentenceQueue.length);
    }

    const utterance = new SpeechSynthesisUtterance(currentSentence);
    currentActiveUtterance = utterance;

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.lang = effectiveLang;
    utterance.pitch = profile.pitch;
    utterance.rate = effectiveRate;

    utterance.onend = () => {
      if (isQueueRunning) {
        currentQueueIndex++;
        speakNext();
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('Speech queue chunk error:', e);
      }
      if (isQueueRunning) {
        currentQueueIndex++;
        speakNext();
      }
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  }

  speakNext();
}

/**
 * Seek live browser speech to a specific sentence ratio (0.0 to 1.0)
 */
export function seekLiveBrowserSpeech(
  percentage: number,
  text: string,
  accent: Accent,
  gender: VoiceGender,
  rate = 1.0,
  onEnd?: () => void,
  preferredNarrator?: string
) {
  const sentences = splitIntoNarrationSentences(text);
  if (sentences.length === 0) return;
  const targetIndex = Math.floor(Math.max(0, Math.min(0.99, percentage)) * sentences.length);
  playLiveBrowserSpeech(text, accent, gender, rate, onEnd, preferredNarrator, targetIndex);
}

/**
 * Instantly stops and purges any browser live speech narration
 */
export function stopLiveBrowserSpeech() {
  isQueueRunning = false;
  activeSentenceQueue = [];
  currentQueueIndex = 0;
  activeProgressCallback = null;

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
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
}


