import express from 'express';
import path from 'path';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function createWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);

  // "fmt " sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // "data" sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback heuristic parser when AI models are experiencing high demand or for instant local chapter parsing
function splitTextIntoChaptersHeuristic(rawText: string, fileName?: string) {
  const cleaned = rawText.replace(/\r\n/g, '\n').trim();
  const title = (fileName || 'Book Document').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Look for chapter headings like "Chapter 1", "CHAPTER I", "Section 1", "Part 1", "Prologue", "Epilogue", etc.
  const chapterRegex = /(?:^|\n)(?:(?:CHAPTER|Chapter|Section|SECTION|Part|PART|Book|BOOK|Act|ACT)\s+(?:[0-9]+|[IVXLCDM]+|[A-Za-z]+)(?:[:.-]\s*[^\n]*)?|PROLOGUE|Prologue|EPILOGUE|Epilogue|INTRODUCTION|Introduction)/g;
  const matches = [...cleaned.matchAll(chapterRegex)];

  if (matches.length >= 2) {
    const chapters: { chapterNumber: number; title: string; summary: string; text: string }[] = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const heading = match[0].trim();
      const startIndex = match.index! + match[0].length;
      const endIndex = i + 1 < matches.length ? matches[i + 1].index! : cleaned.length;
      const body = cleaned.substring(startIndex, endIndex).trim();

      if (body.length > 20) {
        chapters.push({
          chapterNumber: chapters.length + 1,
          title: heading.length > 60 ? heading.substring(0, 60) + '...' : heading,
          summary: body.substring(0, 120).replace(/\n+/g, ' ') + '...',
          text: body,
        });
      }
    }

    if (chapters.length > 0) {
      return { bookTitle: title, author: 'Author', chapters };
    }
  }

  // If no explicit chapter markers, divide the text evenly into 2 to 6 logical parts by paragraph blocks
  const paragraphs = cleaned.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const totalParagraphs = paragraphs.length;

  let numChapters = 3;
  if (totalParagraphs <= 4) numChapters = Math.max(1, totalParagraphs);
  else if (totalParagraphs >= 30) numChapters = 6;
  else if (totalParagraphs >= 15) numChapters = 4;

  const chunkSize = Math.max(1, Math.ceil(totalParagraphs / numChapters));
  const chapters: { chapterNumber: number; title: string; summary: string; text: string }[] = [];

  for (let i = 0; i < numChapters; i++) {
    const chunkParagraphs = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunkParagraphs.length === 0) break;
    const body = chunkParagraphs.join('\n\n').trim();
    const chapterNum = i + 1;
    chapters.push({
      chapterNumber: chapterNum,
      title: `Chapter ${chapterNum}: ${title} (Part ${chapterNum})`,
      summary: body.substring(0, 100).replace(/\n+/g, ' ') + '...',
      text: body,
    });
  }

  return {
    bookTitle: title,
    author: 'Author',
    chapters: chapters.length > 0 ? chapters : [
      {
        chapterNumber: 1,
        title: `${title} - Full Edition`,
        summary: 'Complete text audio narration.',
        text: cleaned || 'Audiobook narration text.',
      },
    ],
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Clean and sanitize string inputs against malicious characters or buffer abuse
function sanitizeInputString(input: any, maxLength = 200000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).trim();
}

function sanitizeFileName(fileName: any): string {
  if (typeof fileName !== 'string') return 'document.pdf';
  return fileName.replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 120);
}

export interface NarratorProfile {
  id: string;
  name: string;
  accent: 'american' | 'british';
  gender: 'male' | 'female';
  geminiVoice: string;
  systemInstruction: string;
  sampleText: string;
}

export const NARRATOR_PROFILES: Record<string, NarratorProfile> = {
  'am-male-morgan': {
    id: 'am-male-morgan',
    name: 'Morgan (Deep Cinematic Storyteller)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Charon',
    systemInstruction: 'You are Morgan, a legendary American male audiobook narrator with a profound, deep, gravelly baritone voice inspired by Morgan Freeman. Read the text with calm philosophical gravitas, measured storytelling pacing, subtle dramatic pauses, and a deep resonant chest voice.',
    sampleText: 'I must say, stories have a peculiar power to transport the soul. Settle in, and let us embark on this remarkable journey together.'
  },
  'am-male-david': {
    id: 'am-male-david',
    name: 'David (Deep Baritone)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Fenrir',
    systemInstruction: 'You are David, an authoritative, commanding American male baritone narrator. Read the text with deep resonant authority, crisp steady cadence, and formidable presence suitable for history and epic literature.',
    sampleText: 'Welcome. Settle in and prepare to explore the depths of this literary masterpiece.'
  },
  'am-male-marcus': {
    id: 'am-male-marcus',
    name: 'Marcus (Warm Storyteller)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Puck',
    systemInstruction: 'You are Marcus, a warm, expressive, and conversational American male storyteller. Read the text with friendly natural warmth, melodic inflection, and engaging emotional connection.',
    sampleText: 'Welcome to this audiobook edition. Let us begin our journey together through chapter one.'
  },
  'am-male-wyatt': {
    id: 'am-male-wyatt',
    name: 'Wyatt (Texas Drawl)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Puck',
    systemInstruction: 'You are Wyatt, an authentic American country storyteller with a genuine Southern Texas drawl. Read the text with relaxed folksy charm, easygoing Southern rhythm, down-home warmth, and rustic character.',
    sampleText: 'Howdy and welcome to this audio edition. Settle on in, and let us get right into chapter one.'
  },
  'am-male-caleb': {
    id: 'am-male-caleb',
    name: 'Caleb (Vibrant & Energetic)',
    accent: 'american',
    gender: 'male',
    geminiVoice: 'Fenrir',
    systemInstruction: 'You are Caleb, a youthful, crisp, and energetic American male tenor narrator. Read the text with brisk upbeat tempo, vibrant modern enthusiasm, and sharp articulation ideal for thrillers and fast adventure.',
    sampleText: 'Hey there! Fasten your seatbelt as we dive straight into chapter one of this thrilling adventure.'
  },
  'am-female-claire': {
    id: 'am-female-claire',
    name: 'Claire (Warm Storyteller)',
    accent: 'american',
    gender: 'female',
    geminiVoice: 'Kore',
    systemInstruction: 'You are Claire, a gentle, soothing, and comforting American female narrator. Read the text with warm empathetic storytelling cadence, graceful pacing, and tender literary poise.',
    sampleText: 'Welcome to this audio edition. Let us begin our journey together through chapter one.'
  },
  'am-female-ava': {
    id: 'am-female-ava',
    name: 'Ava (Smooth & Melodic)',
    accent: 'american',
    gender: 'female',
    geminiVoice: 'Zephyr',
    systemInstruction: 'You are Ava, a silky, smooth, and intimate American female narrator. Read the text with velvety melodic flow, gentle hypnotic cadence, and rich poetic atmosphere.',
    sampleText: 'Welcome to the audio edition. We invite you to sit back, relax, and enjoy the reading.'
  },
  'am-female-emma': {
    id: 'am-female-emma',
    name: 'Emma (Bright & Expressive)',
    accent: 'american',
    gender: 'female',
    geminiVoice: 'Kore',
    systemInstruction: 'You are Emma, a bright, cheerful, and articulate American female narrator. Read the text with sparkling clarity, lively upbeat cadence, and expressive youthful clarity.',
    sampleText: 'Welcome to this audiobook. Let these words unfold vividly as we begin our story.'
  },
  'br-male-jarvis': {
    id: 'br-male-jarvis',
    name: 'JARVIS AI',
    accent: 'british',
    gender: 'male',
    geminiVoice: 'Charon',
    systemInstruction: 'You are JARVIS AI, the iconic British AI assistant inspired by the voice of British actor Paul Bettany. Speak in an impeccably polished British Received Pronunciation (RP) accent with soft-spoken composure, razor-sharp intelligence, effortless suave charm, polite dry wit, and crystal-clear articulation. Maintain an unflappable, courteous, and sophisticated presence throughout the narration.',
    sampleText: 'Good day. Systems are fully calibrated and operational. At your service, shall we proceed with the narration?'
  },
  'br-male-mark': {
    id: 'br-male-mark',
    name: 'Mark (BBC Wildlife Narrator)',
    accent: 'british',
    gender: 'male',
    geminiVoice: 'Fenrir',
    systemInstruction: 'You are Mark, an acclaimed British BBC nature and wildlife documentary narrator inspired by Mark Carwardine. Read the text in a distinguished British Received Pronunciation (RP) accent with infectious natural wonder, articulate erudition, dramatic documentary pauses, and vivid storytelling enthusiasm.',
    sampleText: 'It is truly one of nature’s most magnificent spectacles. Join me as we uncover the extraordinary story waiting just ahead.'
  },
  'br-male-arthur': {
    id: 'br-male-arthur',
    name: 'Arthur (Classical Baritone)',
    accent: 'british',
    gender: 'male',
    geminiVoice: 'Charon',
    systemInstruction: 'You are Arthur, a classical British Oxford gentleman baritone narrator. Read the text with stately Victorian elegance, dry dignified wit, formal British RP cadence, and rich theatrical depth.',
    sampleText: 'Good day and welcome to this audio edition. We shall now commence our journey.'
  },
  'br-male-oliver': {
    id: 'br-male-oliver',
    name: 'Oliver (Modern & Articulate)',
    accent: 'british',
    gender: 'male',
    geminiVoice: 'Puck',
    systemInstruction: 'You are Oliver, a modern, articulate, and confident contemporary British male narrator. Read the text at a brisk, engaging, and moderately swift pace (approximately 10–15% faster than standard), while keeping every word crystal clear, polished, and articulate. Maintain natural phrasing and pauses at punctuation, commas, periods, and paragraph breaks without compressing pauses or rushing individual syllables. Deliver with modern British intonation, refined diction, and lively storytelling confidence.',
    sampleText: 'Welcome to this audiobook. Let us delve into the remarkable narrative that lies ahead.'
  },
  'br-female-eleanor': {
    id: 'br-female-eleanor',
    name: 'Eleanor (Warm Literary)',
    accent: 'british',
    gender: 'female',
    geminiVoice: 'Zephyr',
    systemInstruction: 'You are Eleanor, an aristocratic, sophisticated British female narrator with a refined Queen\'s English accent. Read the text with cultured literary grace, poised eloquence, and velvety period-drama depth.',
    sampleText: 'Good day and welcome to this audio edition. We shall now commence chapter one.'
  },
  'br-female-charlotte': {
    id: 'br-female-charlotte',
    name: 'Charlotte (Bright & Expressive)',
    accent: 'british',
    gender: 'female',
    geminiVoice: 'Zephyr',
    systemInstruction: 'You are Charlotte, a charming, theatrical, and vibrant British female storyteller. Read the text with expressive British inflection, bright whimsical color, and delightful fairytale storytelling flair.',
    sampleText: 'Welcome to this audio edition. I am delighted to guide you through each chapter.'
  },
};

const sampleAudioCache = new Map<string, { audioUrl: string; audioBase64: string; duration: number; voiceId: string; voiceName: string }>();

const ALLOWED_GEMINI_VOICES: Record<string, string> = {
  puck: 'Puck',
  charon: 'Charon',
  kore: 'Kore',
  fenrir: 'Fenrir',
  zephyr: 'Zephyr',
};

function normalizeGeminiVoice(voiceName: string): string {
  if (!voiceName) return 'Puck';
  const lower = voiceName.toLowerCase().trim();
  if (ALLOWED_GEMINI_VOICES[lower]) {
    return ALLOWED_GEMINI_VOICES[lower];
  }
  // Mappings for common names or previous aliases
  if (lower.includes('charon') || lower.includes('morgan') || lower.includes('jarvis') || lower.includes('arthur')) return 'Charon';
  if (lower.includes('fenrir') || lower.includes('david') || lower.includes('mark') || lower.includes('caleb')) return 'Fenrir';
  if (lower.includes('puck') || lower.includes('wyatt') || lower.includes('oliver') || lower.includes('marcus')) return 'Puck';
  if (lower.includes('kore') || lower.includes('claire') || lower.includes('emma')) return 'Kore';
  if (lower.includes('zephyr') || lower.includes('eleanor') || lower.includes('ava') || lower.includes('charlotte')) return 'Zephyr';
  return 'Puck';
}

function extractPcmFromWav(wavBuffer: Buffer): { pcm: Buffer; sampleRate: number; numChannels: number; bitsPerSample: number } {
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;

  if (wavBuffer.length >= 44 && wavBuffer.toString('ascii', 0, 4) === 'RIFF' && wavBuffer.toString('ascii', 8, 12) === 'WAVE') {
    sampleRate = wavBuffer.readUInt32LE(24);
    numChannels = wavBuffer.readUInt16LE(22);
    bitsPerSample = wavBuffer.readUInt16LE(34);
    console.log(`[GEMINI TTS FORMAT] Detected standard RIFF WAV header from API: sampleRate=${sampleRate}Hz, channels=${numChannels}, bitsPerSample=${bitsPerSample}`);
  } else {
    console.log(`[GEMINI TTS FORMAT] No RIFF WAV header detected, assuming raw PCM 24000Hz mono 16-bit`);
  }

  if (wavBuffer.length < 44) {
    return { pcm: wavBuffer, sampleRate, numChannels, bitsPerSample };
  }

  // Verify if it has a standard RIFF/WAVE header.
  if (wavBuffer.toString('ascii', 0, 4) !== 'RIFF' || wavBuffer.toString('ascii', 8, 12) !== 'WAVE') {
    // If not a RIFF file, it might already be raw PCM
    return { pcm: wavBuffer, sampleRate, numChannels, bitsPerSample };
  }

  // Find the 'data' sub-chunk to extract raw PCM data
  let offset = 12;
  while (offset < wavBuffer.length - 8) {
    const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      const dataStart = offset + 8;
      const dataEnd = Math.min(dataStart + chunkSize, wavBuffer.length);
      return { pcm: wavBuffer.subarray(dataStart, dataEnd), sampleRate, numChannels, bitsPerSample };
    }
    // Prevent infinite loop if chunkSize is invalid or 0
    if (chunkSize <= 0) break;
    offset += 8 + chunkSize;
  }

  // Simple substring/index search fallback if parsing chunk offsets failed
  const dataOffset = wavBuffer.indexOf(Buffer.from('data'));
  if (dataOffset !== -1 && dataOffset < wavBuffer.length - 8) {
    const chunkSize = wavBuffer.readUInt32LE(dataOffset + 4);
    const dataStart = dataOffset + 8;
    const dataEnd = Math.min(dataStart + chunkSize, wavBuffer.length);
    return { pcm: wavBuffer.subarray(dataStart, dataEnd), sampleRate, numChannels, bitsPerSample };
  }

  // Heuristic strip of standard 44-byte header
  return { pcm: wavBuffer.subarray(44), sampleRate, numChannels, bitsPerSample };
}

async function generateTTSAudioWithFallback(
  ai: GoogleGenAI,
  text: string,
  voiceName: string
): Promise<{ pcm: Buffer; sampleRate: number; numChannels: number; bitsPerSample: number } | null> {
  const normalizedVoice = normalizeGeminiVoice(voiceName);
  const TTS_MODELS = [
    'gemini-3.1-flash-tts-preview',
  ];
  for (const model of TTS_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: normalizedVoice },
            },
          },
        },
      });
      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) {
        const fullBuffer = Buffer.from(data, 'base64');
        return extractPcmFromWav(fullBuffer);
      }
    } catch (err: any) {
      const isQuotaError = err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota') || err?.message?.includes('429');
      if (isQuotaError) {
        console.warn(`TTS quota limit hit for model ${model} (will fallback smoothly to client speech synthesis)`);
      } else {
        console.warn(`TTS attempt with model ${model} failed:`, err?.message || err);
      }
    }
  }
  return null;
}

function resolveNarratorProfile(voiceId?: string, accent?: string, gender?: string): NarratorProfile {
  if (voiceId && NARRATOR_PROFILES[voiceId]) {
    return NARRATOR_PROFILES[voiceId];
  }
  if (voiceId) {
    const vIdLower = voiceId.toLowerCase();
    for (const key of Object.keys(NARRATOR_PROFILES)) {
      if (vIdLower.includes(key) || key.includes(vIdLower)) {
        return NARRATOR_PROFILES[key];
      }
    }
  }
  const isBrit = accent === 'british';
  const isFemale = gender === 'female';
  if (isBrit) {
    return isFemale ? NARRATOR_PROFILES['br-female-eleanor'] : NARRATOR_PROFILES['br-male-mark'];
  }
  return isFemale ? NARRATOR_PROFILES['am-female-claire'] : NARRATOR_PROFILES['am-male-morgan'];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security middleware headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Safe payload limits for PDFs and audio data
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Test / preview sample audio for a specific narrator persona
  app.post('/api/test-voice-sample', async (req, res) => {
    try {
      const voiceId = sanitizeInputString(req.body?.voiceId, 50);
      const profile = resolveNarratorProfile(voiceId);

      if (sampleAudioCache.has(profile.id)) {
        return res.json(sampleAudioCache.get(profile.id));
      }

      const ai = getGeminiClient();
      const ttsResult = await generateTTSAudioWithFallback(ai, profile.sampleText, profile.geminiVoice);

      if (ttsResult && ttsResult.pcm.length > 0) {
        const { pcm, sampleRate, numChannels, bitsPerSample } = ttsResult;
        const wavBuffer = Buffer.concat([createWavHeader(pcm.length, sampleRate, numChannels, bitsPerSample), pcm]);
        const durationSeconds = pcm.length / (sampleRate * numChannels * (bitsPerSample / 8));
        const base64Wav = wavBuffer.toString('base64');

        const result = {
          audioUrl: `data:audio/wav;base64,${base64Wav}`,
          audioBase64: base64Wav,
          audioMimeType: 'audio/wav',
          audioFileExtension: 'wav',
          duration: durationSeconds,
          voiceId: profile.id,
          voiceName: profile.name,
          isClientFallback: false,
        };

        sampleAudioCache.set(profile.id, result);
        return res.json(result);
      }

      // If Gemini TTS is busy or rate limited, return clean client fallback response
      return res.json({
        isClientFallback: true,
        voiceId: profile.id,
        voiceName: profile.name,
        sampleText: profile.sampleText,
        accent: profile.accent,
        gender: profile.gender,
      });
    } catch (err: any) {
      console.warn('Sample preview generation failed via Gemini:', err?.message || err);
      const voiceId = sanitizeInputString(req.body?.voiceId, 50);
      const profile = resolveNarratorProfile(voiceId);
      return res.json({
        isClientFallback: true,
        voiceId: profile.id,
        voiceName: profile.name,
        sampleText: profile.sampleText,
        accent: profile.accent,
        gender: profile.gender,
      });
    }
  });

  // Extract chapters from PDF or raw extracted text
  app.post('/api/extract-chapters', async (req, res) => {
    try {
      const rawText = req.body?.text;
      const pdfBase64 = typeof req.body?.pdfBase64 === 'string' ? req.body.pdfBase64 : undefined;
      const fileName = sanitizeFileName(req.body?.fileName);
      const text = sanitizeInputString(rawText, 500000);

      if (!text && !pdfBase64) {
        return res.status(400).json({ error: 'Please provide either PDF content or extracted text.' });
      }

      // 1. Fast path: If text is provided and contains clear chapter structure, split immediately
      if (text && text.length > 50) {
        const heuristicResult = splitTextIntoChaptersHeuristic(text, fileName);
        if (heuristicResult.chapters.length >= 2) {
          return res.json(heuristicResult);
        }
      }

    const ai = getGeminiClient();

    const instruction = `You are an expert literary audiobook editor.
Analyze the provided document/book content.
Extract the book title, author (if found), and all distinct chapters or sections.
For each chapter:
- chapterNumber: sequential integer starting at 1
- title: meaningful chapter or section title (e.g. "Chapter 1: The Beginning" or "Prologue")
- summary: a 1-sentence brief summary of the chapter
- text: the cleaned, complete narration text for this chapter, removing page numbers, repeating headers/footers, and non-narration boilerplate.

If the document does not have explicit chapter markers, split it into 2 to 6 coherent, logical chapters or sections of balanced length.`;

    let promptContents: any;
    if (pdfBase64) {
      promptContents = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64,
          },
        },
        {
          text: `${instruction}\n\nDocument File Name: ${fileName || 'book.pdf'}`,
        },
      ];
    } else {
      // If text is very long, pass a representative sample for metadata extraction and split text directly
      const textToAnalyze = text.length > 30000 ? text.substring(0, 30000) : text;
      promptContents = `${instruction}\n\nDocument File Name: ${fileName || 'book.txt'}\n\nDocument Content:\n${textToAnalyze}`;
    }

    // Try supported active models
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.6-flash'];
    let extractedResult: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptContents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bookTitle: { type: Type.STRING, description: 'Title of the book or document' },
                author: { type: Type.STRING, description: 'Author name if detectable' },
                chapters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      chapterNumber: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['chapterNumber', 'title', 'text'],
                  },
                },
              },
              required: ['bookTitle', 'chapters'],
            },
          },
        });

        const responseText = response.text || '{}';
        const parsedData = JSON.parse(responseText);

        if (Array.isArray(parsedData.chapters) && parsedData.chapters.length > 0) {
          extractedResult = {
            bookTitle: parsedData.bookTitle || fileName?.replace(/\.[^/.]+$/, '') || 'My Audio Book',
            author: parsedData.author || 'Author',
            chapters: parsedData.chapters,
          };
          break;
        }
      } catch (err: any) {
        // Continue silently to next model or rule-based fallback
      }
      if (extractedResult) break;
    }

    // If AI extraction succeeded, return the result
    if (extractedResult) {
      return res.json(extractedResult);
    }

    // If AI models encounter high demand or quota limits, seamlessly use the heuristic text parser!
    if (text && text.trim().length > 0) {
      const fallbackResult = splitTextIntoChaptersHeuristic(text, fileName);
      return res.json(fallbackResult);
    }

    return res.status(503).json({
      error: 'The AI model is experiencing high demand. Please try again or upload a text-based PDF.',
    });
  } catch (err: any) {
    console.error('Error in /api/extract-chapters:', err?.message || err);
    try {
      const fallbackText = sanitizeInputString(req.body?.text, 500000);
      const fallbackFileName = sanitizeFileName(req.body?.fileName);
      if (fallbackText) {
        return res.json(splitTextIntoChaptersHeuristic(fallbackText, fallbackFileName));
      }
    } catch (e) {
      // ignore
    }
    return res.status(500).json({ error: 'Failed to extract chapters. Please try again with a valid text-based PDF.' });
  }
});

  // Generate speech for a specific chapter
  app.post('/api/generate-speech', async (req, res) => {
    try {
      const rawText = req.body?.text;
      const text = sanitizeInputString(rawText, 500000);
      const accent = req.body?.accent === 'british' ? 'british' : 'american';
      const gender = req.body?.gender === 'female' ? 'female' : 'male';
      const voiceId = sanitizeInputString(req.body?.voiceId, 50);

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required for speech generation.' });
      }

      const ai = getGeminiClient();
      const profile = resolveNarratorProfile(voiceId, accent, gender);
      const selectedVoice = profile.geminiVoice;

      // Clean narration text for audio synthesis
      const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      const words = cleanText.split(/\s+/).filter(Boolean);
      const estimatedDurationSeconds = Math.max(3, Math.round((words.length / 140) * 60));

      // Chunk text into optimal blocks (~400-550 characters) for rapid 24kHz Gemini TTS synthesis
      const MAX_CHUNK_LENGTH = 550;
      const chunks: string[] = [];

      if (cleanText.length <= MAX_CHUNK_LENGTH) {
        chunks.push(cleanText);
      } else {
        const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
        let currentChunk = '';

        for (const sentence of sentences) {
          if ((currentChunk + ' ' + sentence).trim().length > MAX_CHUNK_LENGTH) {
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
      }

      const pcmBuffers: Buffer[] = [];
      let detectedSampleRate = 24000;
      let detectedChannels = 1;
      let detectedBitsPerSample = 16;
      let allChunksSucceeded = true;

      // Synthesize chunks in batches of 2 with concurrency for speed
      const BATCH_SIZE = 2;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (chunk) => {
          const trimmedChunk = chunk.trim();
          if (!trimmedChunk) return null;

          for (let attempt = 1; attempt <= 2; attempt++) {
            const result = await generateTTSAudioWithFallback(ai, trimmedChunk, selectedVoice);
            if (result && result.pcm.length > 0) {
              return result;
            }
            if (attempt === 1) {
              await sleep(300);
            }
          }
          return null;
        });

        const batchResults = await Promise.all(batchPromises);
        for (const result of batchResults) {
          if (result && result.pcm.length > 0) {
            pcmBuffers.push(result.pcm);
            detectedSampleRate = result.sampleRate;
            detectedChannels = result.numChannels;
            detectedBitsPerSample = result.bitsPerSample;
          } else {
            allChunksSucceeded = false;
          }
        }

        if (!allChunksSucceeded) {
          break;
        }
      }

      // Gemini returns raw PCM formatted inside WAV. Wrap the combined PCM directly in WAV with correct parameters.
      if (allChunksSucceeded && pcmBuffers.length === chunks.length && pcmBuffers.length > 0) {
        const combinedPcm = Buffer.concat(pcmBuffers);
        const wavBuffer = Buffer.concat([
          createWavHeader(combinedPcm.length, detectedSampleRate, detectedChannels, detectedBitsPerSample),
          combinedPcm
        ]);
        const durationSeconds = combinedPcm.length / (detectedSampleRate * detectedChannels * (detectedBitsPerSample / 8));
        const base64Wav = wavBuffer.toString('base64');

        return res.json({
          audioUrl: `data:audio/wav;base64,${base64Wav}`,
          audioBase64: base64Wav,
          audioMimeType: 'audio/wav',
          audioFileExtension: 'wav',
          duration: durationSeconds,
          sampleRate: detectedSampleRate,
          voiceUsed: profile.name,
          voiceId: profile.id,
          isClientFallback: false,
          accent: profile.accent,
          gender: profile.gender,
        });
      }

      // If Gemini TTS is quota-limited or unavailable, fall back cleanly to client voice synthesizer with true gender & accent preservation
      return res.json({
        isClientFallback: true,
        voiceUsed: profile.name,
        voiceId: profile.id,
        duration: estimatedDurationSeconds,
        accent: profile.accent,
        gender: profile.gender,
      });
    } catch (err: any) {
      console.error('Error in /api/generate-speech:', err);
      const { text, accent, gender, voiceId } = req.body || {};
      const profile = resolveNarratorProfile(voiceId, accent, gender);
      const words = (text || '').split(/\s+/).filter(Boolean);
      const estimatedDurationSeconds = Math.max(3, Math.round((words.length / 140) * 60));

      return res.json({
        isClientFallback: true,
        voiceUsed: profile.name,
        voiceId: profile.id,
        duration: estimatedDurationSeconds,
        accent: profile.accent,
        gender: profile.gender,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Audiobook server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
