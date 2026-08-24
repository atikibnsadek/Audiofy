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
      const voiceName = sanitizeInputString(req.body?.voiceName, 50);
      const voiceId = sanitizeInputString(req.body?.voiceId, 50);

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required for speech generation.' });
      }

      const ai = getGeminiClient();

      // Resolve best Gemini prebuilt voice based on narrator ID, gender, and accent
      let selectedVoice = voiceName;
      if (voiceId) {
        const idLower = voiceId.toLowerCase();
        if (idLower.includes('morgan') || idLower.includes('david')) selectedVoice = 'Charon'; // Deep baritone / cinematic US male
        else if (idLower.includes('marcus')) selectedVoice = 'Fenrir';  // Warm storyteller US male
        else if (idLower.includes('wyatt') || idLower.includes('caleb')) selectedVoice = 'Puck'; // Texas drawl / Vibrant tenor US male
        else if (idLower.includes('claire')) selectedVoice = 'Kore';    // Warm US female
        else if (idLower.includes('ava')) selectedVoice = 'Zephyr';     // Smooth melodic US female
        else if (idLower.includes('emma')) selectedVoice = 'Kore';      // Bright US female
        else if (idLower.includes('mark') || idLower.includes('arthur')) selectedVoice = 'Fenrir'; // BBC wildlife / Classical British male baritone
        else if (idLower.includes('oliver')) selectedVoice = 'Puck';    // Modern British male tenor
        else if (idLower.includes('eleanor')) selectedVoice = 'Zephyr'; // Sophisticated British female
        else if (idLower.includes('charlotte')) selectedVoice = 'Kore'; // Bright British female
      }

      const VALID_GEMINI_VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      if (!selectedVoice || !VALID_GEMINI_VOICES.includes(selectedVoice)) {
        if (gender === 'female') {
          selectedVoice = accent === 'british' ? 'Zephyr' : 'Kore';
        } else {
          selectedVoice = accent === 'british' ? 'Fenrir' : 'Charon';
        }
      }

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
      let allChunksSucceeded = true;

      // Synthesize chunks in batches of 2 with concurrency for speed
      const BATCH_SIZE = 2;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (chunk) => {
          const trimmedChunk = chunk.trim();
          if (!trimmedChunk) return null;

          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-tts-preview',
                contents: [{ parts: [{ text: trimmedChunk }] }],
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: selectedVoice },
                    },
                  },
                },
              });

              const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (data) {
                return Buffer.from(data, 'base64');
              }
            } catch (err: any) {
              if (attempt === 1) {
                await sleep(350);
              }
            }
          }
          return null;
        });

        const batchResults = await Promise.all(batchPromises);
        for (const result of batchResults) {
          if (result && result.length > 0) {
            pcmBuffers.push(result);
          } else {
            allChunksSucceeded = false;
          }
        }

        if (!allChunksSucceeded) {
          break;
        }
      }

      // If all chunks were synthesized via Gemini TTS, create the WAV audio container
      if (allChunksSucceeded && pcmBuffers.length === chunks.length && pcmBuffers.length > 0) {
        const combinedPcm = Buffer.concat(pcmBuffers);
        const sampleRate = 24000;
        const wavHeader = createWavHeader(combinedPcm.length, sampleRate, 1, 16);
        const fullWavBuffer = Buffer.concat([wavHeader, combinedPcm]);
        const durationSeconds = combinedPcm.length / (sampleRate * 2);
        const base64Wav = fullWavBuffer.toString('base64');

        return res.json({
          audioUrl: `data:audio/wav;base64,${base64Wav}`,
          audioBase64: base64Wav,
          duration: durationSeconds,
          sampleRate,
          voiceUsed: selectedVoice,
          isClientFallback: false,
          accent,
          gender,
        });
      }

      // If Gemini TTS is quota-limited or unavailable, fall back cleanly to client voice synthesizer with true gender & accent preservation
      return res.json({
        isClientFallback: true,
        voiceUsed:
          gender === 'male'
            ? accent === 'british'
              ? 'Arthur (Classical Baritone)'
              : 'David (Deep Baritone)'
            : accent === 'british'
            ? 'Eleanor (Warm Literary)'
            : 'Claire (Warm Storyteller)',
        duration: estimatedDurationSeconds,
        accent: accent || 'american',
        gender: gender || 'male',
      });
    } catch (err: any) {
      console.error('Error in /api/generate-speech:', err);
      const { text, accent, gender } = req.body || {};
      const words = (text || '').split(/\s+/).filter(Boolean);
      const estimatedDurationSeconds = Math.max(3, Math.round((words.length / 140) * 60));

      return res.json({
        isClientFallback: true,
        voiceUsed:
          gender === 'male'
            ? accent === 'british'
              ? 'Arthur (Classical Baritone)'
              : 'David (Deep Baritone)'
            : accent === 'british'
            ? 'Eleanor (Warm Literary)'
            : 'Claire (Warm Storyteller)',
        duration: estimatedDurationSeconds,
        accent: accent || 'american',
        gender: gender || 'male',
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
