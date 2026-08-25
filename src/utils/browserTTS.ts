// Browser Text-To-Speech audio synthesizer for crystal-clear spoken narration with accurate accent and gender matching
import { Accent, VoiceGender } from '../types';
import lamejs from 'lamejs-121-bug';

let cachedVoices: SpeechSynthesisVoice[] = [];

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
    pitch: 0.58, // Deep, gravelly, and wise Morgan Freeman-style baritone
    rateModifier: 0.88, // Measured, cinematic, storytelling cadence with gravity (+5% speed)
  },
  'am-male-david': {
    id: 'am-male-david',
    preferredKeywords: ['david', 'guy', 'christopher', 'alex', 'richard', 'mark', 'fred', 'neural2-d', 'en-us-d', 'en-us-b', 'google uk english male'],
    fallbackKeywords: ['male', 'us english male', 'uk english male'],
    pitch: 0.72, // Deep, resonant authoritative baritone
    rateModifier: 0.99, // (+5% speed)
  },
  'am-male-marcus': {
    id: 'am-male-marcus',
    preferredKeywords: ['mark', 'daniel', 'david', 'guy', 'standard-b', 'en-us-j', 'google uk english male'],
    fallbackKeywords: ['male', 'us english male', 'uk english male'],
    pitch: 0.85, // Balanced, warm, conversational male storyteller
    rateModifier: 1.03, // (+5% speed)
  },
  'am-male-wyatt': {
    id: 'am-male-wyatt',
    preferredKeywords: ['guy', 'steffan', 'david', 'roger', 'mark', 'fred', 'alex', 'richard', 'en-us-d', 'google uk english male'],
    fallbackKeywords: ['male', 'us english male', 'uk english male'],
    pitch: 0.76, // Grounded, folksy Texas drawl
    rateModifier: 0.92, // Relaxed, easygoing Southern storytelling cadence (+5% speed)
  },
  'am-male-caleb': {
    id: 'am-male-caleb',
    preferredKeywords: ['eric', 'roger', 'fred', 'ryan', 'tom', 'junior', 'aaron', 'standard-d', 'google uk english male'],
    fallbackKeywords: ['male'],
    pitch: 1.05, // Crisp, vibrant, energetic modern tenor
    rateModifier: 1.16, // Upbeat, rapid-paced cadence (+5% speed)
  },

  // American Female Narrators
  'am-female-claire': {
    id: 'am-female-claire',
    preferredKeywords: ['google us english', 'zira', 'jenny', 'serena', 'neural2-c', 'kore'],
    fallbackKeywords: ['female', 'us english female', 'us english'],
    pitch: 0.96, // Warm classic gentle storyteller
    rateModifier: 1.00, // (+5% speed)
  },
  'am-female-ava': {
    id: 'am-female-ava',
    preferredKeywords: ['aria', 'samantha', 'susan', 'veena', 'wavenet-c', 'google us english'],
    fallbackKeywords: ['female', 'us english'],
    pitch: 0.86, // Deep, velvety, smooth melodic poise
    rateModifier: 0.95, // Intimate, hypnotic cadence (+5% speed)
  },
  'am-female-emma': {
    id: 'am-female-emma',
    preferredKeywords: ['michelle', 'victoria', 'karen', 'tessa', 'fiona', 'ana', 'standard-c', 'google us english'],
    fallbackKeywords: ['female', 'us english'],
    pitch: 1.22, // Bright, articulate, sparkling youthful clarity
    rateModifier: 1.11, // Lively, engaging cadence (+5% speed)
  },

  // British Male Narrators (Strictly Male British/UK voices)
  'br-male-jarvis': {
    id: 'br-male-jarvis',
    preferredKeywords: ['google uk english male', 'george', 'daniel', 'oliver', 'en-gb-d', 'en-gb-b', 'uk english male', 'english male'],
    fallbackKeywords: ['uk english male', 'english male', 'male'],
    pitch: 0.88, // Paul Bettany inspired: calm, cultured, suave, and articulate British AI assistant tone
    rateModifier: 0.97, // Smooth, polite, articulate cadence with immaculate British RP diction (+5% speed)
  },
  'br-male-mark': {
    id: 'br-male-mark',
    preferredKeywords: ['google uk english male', 'george', 'daniel', 'oliver', 'en-gb-b', 'en-gb-d', 'uk english male', 'english male'],
    fallbackKeywords: ['uk english male', 'english male', 'male'],
    pitch: 0.82, // Warm, erudite BBC natural history cadence inspired by Mark Carwardine
    rateModifier: 0.99, // Engaging, articulate documentary pacing with dramatic pauses (+5% speed)
  },
  'br-male-arthur': {
    id: 'br-male-arthur',
    preferredKeywords: ['google uk english male', 'george', 'daniel', 'uk english male', 'english (united kingdom) male', 'en-gb-b', 'oliver', 'fenrir'],
    fallbackKeywords: ['uk english male', 'english male', 'male'],
    pitch: 0.68, // Stately Victorian Oxford gentleman baritone
    rateModifier: 0.92, // Formal, measured, literary British cadence (+5% speed)
  },
  'br-male-oliver': {
    id: 'br-male-oliver',
    preferredKeywords: ['google uk english male', 'steffan', 'guy', 'christopher', 'alex', 'richard', 'en-gb-d', 'roger', 'eric', 'oliver'],
    fallbackKeywords: ['uk english male', 'english male', 'male'],
    pitch: 0.95, // Clear, modern articulate British male tenor (original voice identity completely unchanged)
    rateModifier: 1.20, // Brisk, natural conversational cadence with clear articulation (+5% speed)
  },

  // British Female Narrators
  'br-female-eleanor': {
    id: 'br-female-eleanor',
    preferredKeywords: ['google uk english female', 'hazel', 'victoria', 'serena', 'sonia', 'en-gb-a', 'libby'],
    fallbackKeywords: ['uk english female', 'female'],
    pitch: 0.94, // Aristocratic, sophisticated period-drama British female
    rateModifier: 0.97, // Refined, cultured cadence (+5% speed)
  },
  'br-female-charlotte': {
    id: 'br-female-charlotte',
    preferredKeywords: ['google uk english female', 'stephanie', 'alice', 'catherine', 'en-gb-c'],
    fallbackKeywords: ['uk english female', 'female'],
    pitch: 1.18, // Bright, theatrical, whimsical British storyteller
    rateModifier: 1.09, // Vibrant storytelling tempo (+5% speed)
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

export function convertSamplesToMp3Blob(samples: Int16Array, sampleRate = 22050, kbps = 128): Blob {
  try {
    const encoder = new lamejs.Mp3Encoder(1, sampleRate, kbps);
    const mp3Chunks: Uint8Array[] = [];
    const sampleBlockSize = 1152;
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = encoder.encodeBuffer(sampleChunk);
      if (mp3buf && mp3buf.length > 0) {
        mp3Chunks.push(new Uint8Array(mp3buf));
      }
    }
    const mp3flush = encoder.flush();
    if (mp3flush && mp3flush.length > 0) {
      mp3Chunks.push(new Uint8Array(mp3flush));
    }
    return new Blob(mp3Chunks, { type: 'audio/mp3' });
  } catch (err) {
    console.error('Client PCM to MP3 encoding failed, falling back to WAV:', err);
    const wavBytes = createWavBuffer(samples, sampleRate, 1);
    return new Blob([wavBytes], { type: 'audio/wav' });
  }
}

/**
 * Generate speech audio MP3 container for chapter export/download
 * Uses acoustic formant speech synthesis to articulate text phonemes, vowels, consonants, and pitch intonations
 */
export async function generateClientSpeechAudio(
  text: string,
  accent: Accent,
  gender: VoiceGender,
  signal?: AbortSignal
): Promise<{ audioUrl: string; audioBase64: string; duration: number }> {
  const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleanText) {
    const emptyBlob = convertSamplesToMp3Blob(new Int16Array(22050), 22050, 128);
    return {
      audioUrl: URL.createObjectURL(emptyBlob),
      audioBase64: await blobToBase64(emptyBlob),
      duration: 1,
    };
  }

  if (signal?.aborted) {
    throw new DOMException('Speech generation cancelled', 'AbortError');
  }

  const sampleRate = 22050;
  const isFemale = gender === 'female';
  const isBritish = accent === 'british';
  const baseF0 = isFemale ? 210 : 130;

  // Split text into words and punctuation
  const tokens = cleanText.match(/[a-zA-Z0-9']+|[.!?,;:—]/g) || [cleanText];
  const pcmSamples: number[] = [];

  const vowelFormants: Record<string, [number, number, number]> = {
    a: [730, 1090, 2440],
    e: [530, 1840, 2480],
    i: [270, 2290, 3010],
    o: [570, 840, 2410],
    u: [300, 870, 2240],
    y: [320, 2100, 2800],
    default: [500, 1500, 2500],
  };

  const isVowelChar = (ch: string) => /[aeiouy]/i.test(ch);
  const isFricativeChar = (ch: string) => /[szfxcv]/i.test(ch);
  const isPlosiveChar = (ch: string) => /[tdkpgb]/i.test(ch);
  const isNasalChar = (ch: string) => /[mn]/i.test(ch);

  let sentenceProgress = 0;

  for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
    if (signal?.aborted) {
      throw new DOMException('Speech generation cancelled', 'AbortError');
    }

    const token = tokens[tIdx];

    // Handle punctuation pause
    if (/^[.!?,;:—]$/.test(token)) {
      const pauseDurationMs = /[.!?]/.test(token) ? 380 : 180;
      const pauseSamples = Math.round((pauseDurationMs / 1000) * sampleRate);
      for (let p = 0; p < pauseSamples; p++) {
        pcmSamples.push(0);
      }
      if (/[.!?]/.test(token)) sentenceProgress = 0;
      continue;
    }

    sentenceProgress += 1;
    const word = token.toLowerCase();

    for (let cIdx = 0; cIdx < word.length; cIdx++) {
      const char = word[cIdx];

      // Phoneme duration based on sound class
      const durationMs = isVowelChar(char)
        ? 95
        : isFricativeChar(char)
        ? 60
        : isPlosiveChar(char)
        ? 40
        : 70;
      const numSamples = Math.round((durationMs / 1000) * sampleRate);

      let f1 = 500,
        f2 = 1500,
        f3 = 2500;
      if (isVowelChar(char)) {
        [f1, f2, f3] = vowelFormants[char] || vowelFormants.default;
      } else if (isNasalChar(char)) {
        [f1, f2, f3] = [250, 1050, 2100];
      }

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const progress = i / numSamples;
        // Smooth Hann amplitude envelope for phoneme articulation
        const env = Math.sin(Math.PI * progress);

        // Intonation pitch contour (slight rise at sentence start, drop at end)
        const intonationFactor = 1.0 + 0.08 * Math.sin((sentenceProgress % 10) * 0.3) - (cIdx === word.length - 1 ? 0.04 : 0);
        const pitchF0 = baseF0 * intonationFactor * (isBritish ? 1.05 : 1.0);

        let sampleVal = 0;

        if (isVowelChar(char) || isNasalChar(char)) {
          // Glottal excitation pulse train
          const glottal = (t * pitchF0 % 1.0) < 0.35 ? 0.9 : -0.25;
          // Resonant formant filtering
          const res1 = Math.sin(2 * Math.PI * f1 * t) * 0.45;
          const res2 = Math.sin(2 * Math.PI * f2 * t) * 0.28;
          const res3 = Math.sin(2 * Math.PI * f3 * t) * 0.15;
          sampleVal = glottal * (res1 + res2 + res3) * env * 0.7;
        } else if (isFricativeChar(char)) {
          // White noise fricative burst for S/Z/F/X
          const noise = (Math.random() * 2.0 - 1.0) * 0.55;
          const bandpassFilter = Math.sin(2 * Math.PI * 4800 * t);
          sampleVal = noise * bandpassFilter * env * 0.6;
        } else if (isPlosiveChar(char)) {
          // Plosive burst attack for T/D/K/P/B
          const burst = (Math.random() * 2.0 - 1.0) * 0.75;
          sampleVal = burst * Math.exp(-progress * 14.0) * 0.7;
        } else {
          // Liquid / glide consonant tone
          sampleVal = Math.sin(2 * Math.PI * pitchF0 * t) * 0.25 * env;
        }

        const pcm16 = Math.max(-32768, Math.min(32767, Math.round(sampleVal * 28000)));
        pcmSamples.push(pcm16);
      }
    }

    // Inter-word pause (80ms)
    const wordPauseSamples = Math.round(0.08 * sampleRate);
    for (let p = 0; p < wordPauseSamples; p++) {
      pcmSamples.push(0);
    }
  }

  const pcmBuffer = new Int16Array(pcmSamples);
  const totalSeconds = Math.max(1, Math.round(pcmBuffer.length / sampleRate));
  const blob = convertSamplesToMp3Blob(pcmBuffer, sampleRate, 128);
  const audioUrl = URL.createObjectURL(blob);
  const audioBase64 = await blobToBase64(blob);

  return {
    audioUrl,
    audioBase64,
    duration: totalSeconds,
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
let currentActiveUtterance: SpeechSynthesisUtterance | null = null;
let liveSpeechEndHandler: (() => void) | null = null;
let activeSpeechVolume = 0.85;
let restartCurrentUtterance: (() => void) | null = null;

/**
 * Dynamically adjust volume for active and queued live browser speech (0.0 to 1.0)
 */
export function setLiveBrowserSpeechVolume(vol: number): void {
  const nextVolume = Math.max(0, Math.min(1, vol));
  const changed = nextVolume !== activeSpeechVolume;
  activeSpeechVolume = nextVolume;
  if (currentActiveUtterance) {
    currentActiveUtterance.volume = activeSpeechVolume;
  }
  // Browser engines generally apply SpeechSynthesisUtterance.volume only when
  // an utterance starts. Restart the current sentence so the new level takes effect.
  if (changed && isQueueRunning && restartCurrentUtterance) {
    restartCurrentUtterance();
  }
}

export function getLiveBrowserSpeechVolume(): number {
  return activeSpeechVolume;
}

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
    utterance.volume = Math.max(0, Math.min(1, activeSpeechVolume));

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
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
}


