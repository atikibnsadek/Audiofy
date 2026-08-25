import React, { useState, useEffect, useRef } from 'react';
import { Chapter, Accent, VoiceGender, GeneratedAudioFile, AppTheme } from './types';
import { SAMPLE_BOOKS, SampleBook, VOICE_OPTIONS } from './data/sampleBooks';
import { Navbar } from './components/Navbar';
import { PdfUploader } from './components/PdfUploader';
import { VoiceSelector } from './components/VoiceSelector';
import { ChapterList } from './components/ChapterList';
import { AudioPlayer } from './components/AudioPlayer';
import { ChapterReaderModal } from './components/ChapterReaderModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { AudioDownloadsModal } from './components/AudioDownloadsModal';
import { fileToBase64, extractTextFromPdf } from './utils/pdfParser';
import { downloadSingleAudio, downloadAllChaptersAsZip } from './utils/audioDownloader';
import { generateClientSpeechAudio, stopLiveBrowserSpeech } from './utils/browserTTS';
import { Loader2, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

export default function App() {
  // Default to Time Machine sample so user sees an active experience instantly
  const defaultSample = SAMPLE_BOOKS[0];

  // Theme State: 'light' (normal) | 'dark' | 'rainbow' (soft colorful mix)
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('audiobookify_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'rainbow') {
        return saved;
      }
    } catch (e) {
      console.warn('Could not load theme preference:', e);
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('audiobookify_theme', theme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'rainbow';
      return 'light';
    });
  };

  const isDark = theme === 'dark';
  const isRainbow = theme === 'rainbow';

  const [bookTitle, setBookTitle] = useState<string>(defaultSample.title);
  const [author, setAuthor] = useState<string>(defaultSample.author);
  const [chapters, setChapters] = useState<Chapter[]>(
    defaultSample.chapters.map((ch) => ({ ...ch, status: 'idle' }))
  );
  const [selectedFileName, setSelectedFileName] = useState<string | undefined>(undefined);
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>(defaultSample.id);

  // Persistent Stored Audio Variations Library
  const [storedAudioFiles, setStoredAudioFiles] = useState<GeneratedAudioFile[]>(() => {
    try {
      const saved = localStorage.getItem('audiobookify_stored_audios');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load stored audios from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('audiobookify_stored_audios', JSON.stringify(storedAudioFiles));
    } catch (e) {
      console.warn('Could not save stored audios to localStorage:', e);
    }
  }, [storedAudioFiles]);

  // Voice Settings
  const [accent, setAccent] = useState<Accent>('british');
  const [gender, setGender] = useState<VoiceGender>('male');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('br-male-jarvis');

  // Audio Playback State
  const [currentPlayingChapterId, setCurrentPlayingChapterId] = useState<string | null>(null);
  const [customPlayingTrack, setCustomPlayingTrack] = useState<Chapter | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Async / Generation States
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string>('');
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Abort Controllers for stopping audio generation
  const activeControllersRef = useRef<{ [chapterId: string]: AbortController }>({});
  const shouldStopBatchRef = useRef<boolean>(false);

  // Modals
  const [readingChapter, setReadingChapter] = useState<Chapter | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isAudioDownloadsOpen, setIsAudioDownloadsOpen] = useState<boolean>(false);

  // Voice Settings Handlers
  const handleAccentChange = (newAccent: Accent) => {
    setAccent(newAccent);
    const matched = VOICE_OPTIONS.find((v) => v.accent === newAccent && v.gender === gender);
    if (matched) {
      setSelectedVoiceId(matched.id);
    }
  };

  const handleGenderChange = (newGender: VoiceGender) => {
    setGender(newGender);
    const matched = VOICE_OPTIONS.find((v) => v.accent === accent && v.gender === newGender);
    if (matched) {
      setSelectedVoiceId(matched.id);
    }
  };

  // Load sample book
  const handleSelectSample = (sample: SampleBook) => {
    setSelectedSampleId(sample.id);
    setSelectedFileName(undefined);
    setBookTitle(sample.title);
    setAuthor(sample.author);
    setChapters(sample.chapters.map((ch) => ({ ...ch, status: 'idle' })));
    setCurrentPlayingChapterId(null);
    setIsPlaying(false);
    stopLiveBrowserSpeech();
    setErrorMessage(null);
  };

  // Upload custom PDF
  const handleFileSelect = async (file: File) => {
    let extractedText = '';
    try {
      setSelectedSampleId(undefined);
      setSelectedFileName(file.name);
      setIsExtractingPdf(true);
      setPdfStatusMessage('Reading PDF structure and extracting chapters...');
      setErrorMessage(null);
      setCurrentPlayingChapterId(null);
      setIsPlaying(false);

      // Attempt client-side text extraction
      const { text, pageCount } = await extractTextFromPdf(file);
      extractedText = text;
      let pdfBase64 = '';

      if (!text || text.length < 50) {
        setPdfStatusMessage('Processing PDF pages...');
        pdfBase64 = await fileToBase64(file);
      }

      setPdfStatusMessage('Organizing book chapters for audio...');

      let data: any = null;
      try {
        const response = await fetch('/api/extract-chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text && text.length > 50 ? text : undefined,
            pdfBase64: pdfBase64 || undefined,
            fileName: file.name,
          }),
        });

        if (response.ok) {
          data = await response.json();
        }
      } catch (fetchErr) {
        console.warn('Backend extraction network issue, using local fallback:', fetchErr);
      }

      // If backend returned data successfully
      if (data && Array.isArray(data.chapters) && data.chapters.length > 0) {
        setBookTitle(data.bookTitle || file.name.replace(/\.[^/.]+$/, ''));
        setAuthor(data.author || 'Author');

        const extractedChapters: Chapter[] = data.chapters.map((ch: any, idx: number) => {
          const wordCount = (ch.text || '').split(/\s+/).filter(Boolean).length;
          return {
            id: `custom-ch-${idx + 1}-${Date.now()}`,
            chapterNumber: ch.chapterNumber || idx + 1,
            title: ch.title || `Chapter ${idx + 1}`,
            summary: ch.summary || '',
            text: ch.text || '',
            wordCount,
            estimatedMinutes: Math.max(1, Math.round(wordCount / 140)),
            status: 'idle',
          };
        });

        setChapters(extractedChapters);
        return;
      }

      // Fallback: If text was extracted locally from PDF, build chapters locally!
      if (extractedText && extractedText.trim().length > 30) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setBookTitle(cleanTitle);
        setAuthor('Author');

        const paragraphs = extractedText.split(/\n\n+/).filter((p) => p.trim().length > 0);
        const numChapters = paragraphs.length > 10 ? 4 : paragraphs.length > 3 ? 2 : 1;
        const chunkSize = Math.ceil(paragraphs.length / numChapters);

        const localChapters: Chapter[] = [];
        for (let i = 0; i < numChapters; i++) {
          const chunk = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize).join('\n\n');
          if (!chunk) break;
          const wordCount = chunk.split(/\s+/).filter(Boolean).length;
          localChapters.push({
            id: `local-ch-${i + 1}-${Date.now()}`,
            chapterNumber: i + 1,
            title: `Chapter ${i + 1}: ${cleanTitle} (Part ${i + 1})`,
            summary: chunk.substring(0, 80).replace(/\n/g, ' ') + '...',
            text: chunk,
            wordCount,
            estimatedMinutes: Math.max(1, Math.round(wordCount / 140)),
            status: 'idle',
          });
        }

        if (localChapters.length > 0) {
          setChapters(localChapters);
          return;
        }
      }

      throw new Error('Could not parse text from this PDF. Please make sure the PDF contains readable text.');
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setErrorMessage(err.message || 'Could not parse the PDF. Please check the file and try again.');
    } finally {
      setIsExtractingPdf(false);
      setPdfStatusMessage('');
    }
  };

  // Generate audio for a single chapter
  const handleGenerateSingleChapter = async (chapterId: string): Promise<boolean> => {
    const chapterIndex = chapters.findIndex((c) => c.id === chapterId);
    if (chapterIndex === -1) return false;

    const targetChapter = chapters[chapterIndex];

    // Create abort controller for stopping this chapter's generation
    const controller = new AbortController();
    activeControllersRef.current[chapterId] = controller;

    // Mark status as generating
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, status: 'generating', errorMessage: undefined } : c))
    );

    const activeVoice =
      VOICE_OPTIONS.find((v) => v.id === selectedVoiceId && v.accent === accent && v.gender === gender) ||
      VOICE_OPTIONS.find((v) => v.accent === accent && v.gender === gender) ||
      VOICE_OPTIONS[0];

    try {
      const res = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: targetChapter.text,
          accent,
          gender,
          voiceName: activeVoice.geminiVoice,
          voiceId: activeVoice.id,
          chapterTitle: targetChapter.title,
        }),
      });

      let audioUrl = '';
      let audioBase64 = '';
      let audioMimeType: string | undefined;
      let audioFileExtension: 'mp3' | 'wav' | undefined;
      let duration = 0;
      let isClientFallback = false;
      let isDownloadable = false;
      let voiceUsed = activeVoice.name;

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          audioUrl = data.audioUrl;
          audioBase64 = data.audioBase64 || '';
          audioMimeType = data.audioMimeType;
          audioFileExtension = data.audioFileExtension;
          duration = data.duration || targetChapter.estimatedMinutes * 60;
          voiceUsed = data.voiceUsed || activeVoice.name;
          isClientFallback = !!data.isClientFallback;
          isDownloadable = !isClientFallback && Boolean(audioBase64);
        } else if (data.isClientFallback) {
          const fallbackAudio = await generateClientSpeechAudio(
            targetChapter.text,
            accent,
            gender,
            controller.signal
          );
          audioUrl = fallbackAudio.audioUrl;
          audioBase64 = fallbackAudio.audioBase64;
          duration = data.duration || fallbackAudio.duration;
          voiceUsed = data.voiceUsed || activeVoice.name;
          isClientFallback = true;
          isDownloadable = false;
        } else {
          audioUrl = data.audioUrl || '';
          audioBase64 = data.audioBase64 || '';
          duration = data.duration || targetChapter.estimatedMinutes * 60;
          voiceUsed = data.voiceUsed || activeVoice.name;
          isClientFallback = false;
          isDownloadable = Boolean(audioBase64);
        }
      } else {
        // If server hits quota limits or is unavailable, use client speech synthesizer fallback
        console.warn('Server TTS returned non-200. Using client-side speech synthesizer fallback.');
        const fallbackAudio = await generateClientSpeechAudio(
          targetChapter.text,
          accent,
          gender,
          controller.signal
        );
        audioUrl = fallbackAudio.audioUrl;
        audioBase64 = fallbackAudio.audioBase64;
        duration = fallbackAudio.duration;
        isClientFallback = true;
        isDownloadable = false;
      }

      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapterId
            ? {
                ...c,
                status: 'ready',
                audioUrl,
                audioBase64,
                audioMimeType,
                audioFileExtension,
                audioDuration: duration,
                isClientFallback,
                isDownloadable,
                voiceUsed,
                accentUsed: accent,
                genderUsed: gender,
              }
            : c
        )
      );

      // Save this generated audio variant to the persistent Downloads Library
      const newGeneratedItem: GeneratedAudioFile = {
        id: `audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        chapterId: targetChapter.id,
        chapterNumber: targetChapter.chapterNumber,
        chapterTitle: targetChapter.title,
        bookTitle: bookTitle || 'Audiobook',
        accent,
        gender,
        voiceName: voiceUsed || activeVoice.name,
        audioUrl,
        audioBase64,
        audioMimeType,
        audioFileExtension,
        audioDuration: duration || targetChapter.estimatedMinutes * 60,
        createdAt: Date.now(),
        isClientFallback,
        isDownloadable,
      };

      setStoredAudioFiles((prev) => [newGeneratedItem, ...prev]);

      // If no track is currently playing, set this ready chapter as current
      if (!currentPlayingChapterId) {
        setCurrentPlayingChapterId(chapterId);
      }

      return true;
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.log('Audio generation cancelled for chapter:', chapterId);
        setChapters((prev) =>
          prev.map((c) => (c.id === chapterId ? { ...c, status: 'idle', errorMessage: undefined } : c))
        );
        return false;
      }

      console.warn('Attempting client-side speech synthesizer fallback after error:', err);
      try {
        const fallbackAudio = await generateClientSpeechAudio(
          targetChapter.text,
          accent,
          gender,
          controller.signal
        );
        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? {
                  ...c,
                  status: 'ready',
                  audioUrl: fallbackAudio.audioUrl,
                audioBase64: fallbackAudio.audioBase64,
                audioMimeType: 'audio/mpeg',
                audioFileExtension: 'mp3',
                audioDuration: fallbackAudio.duration,
                isClientFallback: true,
                isDownloadable: false,
                  accentUsed: accent,
                  genderUsed: gender,
                }
              : c
          )
        );

        // Also add fallback audio to Downloads Library
        const newFallbackItem: GeneratedAudioFile = {
          id: `audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          chapterId: targetChapter.id,
          chapterNumber: targetChapter.chapterNumber,
          chapterTitle: targetChapter.title,
          bookTitle: bookTitle || 'Audiobook',
          accent,
          gender,
          voiceName: activeVoice.name,
          audioUrl: fallbackAudio.audioUrl,
          audioBase64: fallbackAudio.audioBase64,
          audioMimeType: 'audio/mpeg',
          audioFileExtension: 'mp3',
          audioDuration: fallbackAudio.duration,
          createdAt: Date.now(),
          isClientFallback: true,
          isDownloadable: false,
        };
        setStoredAudioFiles((prev) => [newFallbackItem, ...prev]);

        if (!currentPlayingChapterId) {
          setCurrentPlayingChapterId(chapterId);
        }
        return true;
      } catch (fallbackErr: any) {
        if (fallbackErr.name === 'AbortError' || controller.signal.aborted) {
          setChapters((prev) =>
            prev.map((c) => (c.id === chapterId ? { ...c, status: 'idle', errorMessage: undefined } : c))
          );
          return false;
        }

        console.error('Audio generation failed for chapter:', chapterId, fallbackErr);
        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? { ...c, status: 'error', errorMessage: fallbackErr.message || 'Generation failed' }
              : c
          )
        );
        return false;
      }
    } finally {
      delete activeControllersRef.current[chapterId];
    }
  };

  // Stop single chapter generation
  const handleStopSingleChapter = (chapterId: string) => {
    if (activeControllersRef.current[chapterId]) {
      activeControllersRef.current[chapterId].abort();
      delete activeControllersRef.current[chapterId];
    }
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, status: 'idle', errorMessage: undefined } : c))
    );
  };

  // Generate / Regenerate audio for all chapters sequentially
  const handleGenerateAllChapters = async () => {
    setIsGeneratingAll(true);
    shouldStopBatchRef.current = false;
    const ungeneratedChapters = chapters.filter((c) => c.status !== 'ready');
    // If all are already ready, regenerate all; otherwise generate remaining ungenerated ones
    const chaptersToProcess = ungeneratedChapters.length > 0 ? ungeneratedChapters : chapters;

    for (const chapter of chaptersToProcess) {
      if (shouldStopBatchRef.current) {
        break;
      }
      await handleGenerateSingleChapter(chapter.id);
    }
    setIsGeneratingAll(false);
    shouldStopBatchRef.current = false;
  };

  // Stop all generation in progress
  const handleStopAllGeneration = () => {
    shouldStopBatchRef.current = true;
    setIsGeneratingAll(false);

    // Abort all active fetch requests
    Object.values(activeControllersRef.current).forEach((controller: AbortController) => {
      try {
        controller.abort();
      } catch (e) {
        // ignore
      }
    });
    activeControllersRef.current = {};

    // Reset generating chapters to idle
    setChapters((prev) =>
      prev.map((c) => (c.status === 'generating' ? { ...c, status: 'idle', errorMessage: undefined } : c))
    );
  };

  // Play chapter
  const handlePlayChapter = (chapter: Chapter) => {
    stopLiveBrowserSpeech();
    setCustomPlayingTrack(null);

    if (chapter.audioUrl) {
      setCurrentPlayingChapterId(chapter.id);
      setIsPlaying(true);
    } else {
      // If not generated, trigger generation and queue
      handleGenerateSingleChapter(chapter.id);
    }
  };

  // Pause
  const handlePause = () => {
    stopLiveBrowserSpeech();
    setIsPlaying(false);
  };

  // Previous Chapter
  const handlePrevChapter = () => {
    stopLiveBrowserSpeech();
    const currentIndex = chapters.findIndex((c) => c.id === currentPlayingChapterId);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      if (prevChapter.audioUrl) {
        setCustomPlayingTrack(null);
        setCurrentPlayingChapterId(prevChapter.id);
        setIsPlaying(true);
      }
    }
  };

  // Next Chapter
  const handleNextChapter = () => {
    stopLiveBrowserSpeech();
    const currentIndex = chapters.findIndex((c) => c.id === currentPlayingChapterId);
    if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1];
      if (nextChapter.audioUrl) {
        setCustomPlayingTrack(null);
        setCurrentPlayingChapterId(nextChapter.id);
        setIsPlaying(true);
      }
    }
  };

  // Download single chapter
  const handleDownloadSingle = (chapter: Chapter) => {
    downloadSingleAudio(chapter, bookTitle);
  };

  // Download all chapters as zip
  const handleDownloadAllZip = async () => {
    setZipProgress(0);
    try {
      await downloadAllChaptersAsZip(chapters, bookTitle, (pct) => setZipProgress(pct));
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setTimeout(() => setZipProgress(null), 1500);
    }
  };

  // Delete single stored audio file from Downloads Library
  const handleDeleteStoredAudio = (audioId: string) => {
    const targetFile = storedAudioFiles.find((f) => f.id === audioId);
    const updatedFiles = storedAudioFiles.filter((item) => item.id !== audioId);
    setStoredAudioFiles(updatedFiles);

    // If this audio or its chapter is currently playing, immediately stop and close player
    const isPlayingThisAudio =
      currentPlayingChapterId === audioId ||
      (targetFile && currentPlayingChapterId === targetFile.chapterId);

    if (isPlayingThisAudio) {
      setIsPlaying(false);
      stopLiveBrowserSpeech();
      setCurrentPlayingChapterId(null);
      setCustomPlayingTrack(null);
    }

    if (targetFile) {
      // Find remaining stored audios for this chapter
      const remainingForChapter = updatedFiles.filter(
        (f) => f.chapterId === targetFile.chapterId
      );

      setChapters((prev) =>
        prev.map((c) => {
          if (c.id === targetFile.chapterId) {
            if (remainingForChapter.length > 0) {
              // Update front-page chapter to the latest remaining audio variation
              const latest = remainingForChapter[0];
              return {
                ...c,
                status: 'ready',
                audioUrl: latest.audioUrl,
                audioBase64: latest.audioBase64,
                audioMimeType: latest.audioMimeType,
                audioFileExtension: latest.audioFileExtension,
                audioDuration: latest.audioDuration,
                isClientFallback: latest.isClientFallback,
                isDownloadable: latest.isDownloadable,
                voiceUsed: latest.voiceName,
                accentUsed: latest.accent,
                genderUsed: latest.gender,
                errorMessage: undefined,
              };
            } else {
              // No audio files remain for this chapter -> reset front page state to idle
              return {
                ...c,
                status: 'idle',
                audioUrl: undefined,
                audioBase64: undefined,
                audioMimeType: undefined,
                audioFileExtension: undefined,
                audioDuration: undefined,
                isClientFallback: undefined,
                isDownloadable: undefined,
                voiceUsed: undefined,
                accentUsed: undefined,
                genderUsed: undefined,
                errorMessage: undefined,
              };
            }
          }
          return c;
        })
      );
    }
  };

  // Clear all stored audio files
  const handleClearAllStoredAudios = () => {
    setStoredAudioFiles([]);
    setIsPlaying(false);
    stopLiveBrowserSpeech();
    setCurrentPlayingChapterId(null);
    setCustomPlayingTrack(null);
    setChapters((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'idle',
        audioUrl: undefined,
        audioBase64: undefined,
        audioMimeType: undefined,
        audioFileExtension: undefined,
        audioDuration: undefined,
        isClientFallback: undefined,
        isDownloadable: undefined,
        voiceUsed: undefined,
        accentUsed: undefined,
        genderUsed: undefined,
        errorMessage: undefined,
      }))
    );
  };

  // Play a specific stored audio file from library
  const handlePlayStoredAudio = (file: GeneratedAudioFile) => {
    stopLiveBrowserSpeech();

    if (currentPlayingChapterId === file.id && isPlaying) {
      setIsPlaying(false);
      return;
    }

    const existingChapter = chapters.find((c) => c.id === file.chapterId);
    const playChapterObj: Chapter = {
      id: file.id,
      chapterNumber: file.chapterNumber,
      title: `${file.chapterTitle} (${file.accent === 'british' ? '🇬🇧' : '🇺🇸'} ${file.gender === 'female' ? 'Female' : 'Male'})`,
      text: existingChapter?.text || file.chapterTitle,
      wordCount: existingChapter?.wordCount || 100,
      estimatedMinutes: Math.max(1, Math.round(file.audioDuration / 60)),
      status: 'ready',
      audioUrl: file.audioUrl,
      audioBase64: file.audioBase64,
      audioMimeType: file.audioMimeType,
      audioFileExtension: file.audioFileExtension,
      audioDuration: file.audioDuration,
      isClientFallback: file.isClientFallback,
      isDownloadable: file.isDownloadable,
      voiceUsed: file.voiceName,
      accentUsed: file.accent,
      genderUsed: file.gender,
    };

    setCustomPlayingTrack(playChapterObj);
    setCurrentPlayingChapterId(file.id);
    setIsPlaying(true);
  };

  // Delete a specific chapter (removes chapter & its stored audios)
  const handleDeleteChapter = (chapterId: string) => {
    // 1. Remove all stored audios for this chapter
    setStoredAudioFiles((prev) => prev.filter((f) => f.chapterId !== chapterId));

    // 2. Remove chapter from list and renumber
    setChapters((prev) => {
      const updated = prev.filter((c) => c.id !== chapterId);
      return updated.map((ch, idx) => ({
        ...ch,
        chapterNumber: idx + 1,
      }));
    });

    // 3. Stop player if playing this chapter
    if (
      currentPlayingChapterId === chapterId ||
      (customPlayingTrack && customPlayingTrack.id === chapterId)
    ) {
      setIsPlaying(false);
      stopLiveBrowserSpeech();
      setCurrentPlayingChapterId(null);
      setCustomPlayingTrack(null);
    }
  };

  const currentPlayingChapter =
    chapters.find((c) => c.id === currentPlayingChapterId) ||
    (customPlayingTrack && customPlayingTrack.id === currentPlayingChapterId ? customPlayingTrack : null);
  const currentChapterIndex = chapters.findIndex((c) => c.id === currentPlayingChapterId);
  const hasPrev = currentChapterIndex > 0 && Boolean(chapters[currentChapterIndex - 1]?.audioUrl);
  const hasNext =
    currentChapterIndex >= 0 &&
    currentChapterIndex < chapters.length - 1 &&
    Boolean(chapters[currentChapterIndex + 1]?.audioUrl);

  const readyAudioCount = chapters.filter((c) => c.status === 'ready' || Boolean(c.audioUrl)).length;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans pb-28 transition-colors duration-300 ${
        isDark
          ? 'bg-stone-950 text-stone-100'
          : isRainbow
          ? 'bg-gradient-to-br from-rose-50/80 via-purple-50/60 to-sky-50/80 text-slate-900 animate-rainbow-slow'
          : 'bg-stone-100 text-stone-900'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        bookTitle={bookTitle}
        totalChapters={chapters.length}
        readyAudioCount={readyAudioCount}
        storedAudioCount={storedAudioFiles.length}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenAudioDownloads={() => setIsAudioDownloadsOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        {/* Error Alert */}
        {errorMessage && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border p-4 text-sm shadow-xs ${
              isDark
                ? 'border-rose-900/60 bg-rose-950/40 text-rose-300'
                : isRainbow
                ? 'border-rose-300 bg-rose-50/90 text-rose-900'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold underline text-rose-600 hover:text-rose-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Overlay during PDF extraction */}
        {isExtractingPdf && (
          <div
            className={`mb-6 rounded-2xl border p-6 text-center shadow-sm ${
              isDark
                ? 'border-stone-800 bg-stone-900 text-stone-100'
                : isRainbow
                ? 'border-purple-200 bg-white/90 text-slate-900 shadow-purple-100/50'
                : 'border-stone-300 bg-white text-stone-900'
            }`}
          >
            <div className="flex flex-col items-center">
              <Loader2
                className={`h-8 w-8 animate-spin ${
                  isRainbow ? 'text-pink-500' : isDark ? 'text-indigo-400' : 'text-stone-800'
                }`}
              />
              <h4
                className={`mt-3 text-sm font-semibold ${
                  isDark ? 'text-stone-100' : 'text-stone-900'
                }`}
              >
                Processing your Book Document
              </h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                {pdfStatusMessage}
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Minimalist Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 cols): PDF Upload + Voice & Accent Settings */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. PDF Upload Area */}
            <PdfUploader
              onFileSelect={handleFileSelect}
              onSampleSelect={handleSelectSample}
              selectedFileName={selectedFileName}
              selectedSampleId={selectedSampleId}
              isProcessing={isExtractingPdf}
              theme={theme}
            />

            {/* 2. Voice & Accent Selector */}
            <VoiceSelector
              accent={accent}
              gender={gender}
              selectedVoiceId={selectedVoiceId}
              onAccentChange={handleAccentChange}
              onGenderChange={handleGenderChange}
              onVoiceChange={setSelectedVoiceId}
              disabled={isExtractingPdf || isGeneratingAll}
              theme={theme}
            />
          </div>

          {/* Right Column (7 cols): Chapters List & Generation Controls */}
          <div className="lg:col-span-7 space-y-6">
            <ChapterList
              chapters={chapters}
              bookTitle={bookTitle}
              currentPlayingChapterId={currentPlayingChapterId}
              isPlaying={isPlaying}
              onPlayChapter={handlePlayChapter}
              onPause={handlePause}
              onGenerateSingleChapter={handleGenerateSingleChapter}
              onStopSingleChapter={handleStopSingleChapter}
              onGenerateAllChapters={handleGenerateAllChapters}
              onStopAllGeneration={handleStopAllGeneration}
              onDownloadSingle={handleDownloadSingle}
              onDownloadAllZip={handleDownloadAllZip}
              onOpenReader={(ch) => setReadingChapter(ch)}
              onDeleteChapter={handleDeleteChapter}
              isGeneratingAll={isGeneratingAll}
              zipProgress={zipProgress}
              storedAudioCount={storedAudioFiles.length}
              onOpenAudioDownloads={() => setIsAudioDownloadsOpen(true)}
              theme={theme}
            />
          </div>
        </div>
      </main>

      {/* Docked Minimalist Audio Player */}
      <AudioPlayer
        currentChapter={currentPlayingChapter}
        bookTitle={bookTitle}
        isPlaying={isPlaying}
        accent={accent}
        gender={gender}
        theme={theme}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onClose={() => {
          setIsPlaying(false);
          setCurrentPlayingChapterId(null);
          setCustomPlayingTrack(null);
        }}
        onDownloadCurrent={
          currentPlayingChapter && currentPlayingChapter.isDownloadable !== false
            ? () => handleDownloadSingle(currentPlayingChapter)
            : undefined
        }
      />

      {/* Generated Audio Downloads Manager Modal */}
      <AudioDownloadsModal
        isOpen={isAudioDownloadsOpen}
        onClose={() => setIsAudioDownloadsOpen(false)}
        audioFiles={storedAudioFiles}
        bookTitle={bookTitle}
        onDeleteAudioFile={handleDeleteStoredAudio}
        onClearAllAudioFiles={handleClearAllStoredAudios}
        onPlayAudioFile={handlePlayStoredAudio}
        currentlyPlayingId={currentPlayingChapterId}
        isPlaying={isPlaying}
      />

      {/* Chapter Reader Modal */}
      <ChapterReaderModal
        chapter={readingChapter}
        bookTitle={bookTitle}
        isOpen={readingChapter !== null}
        onClose={() => setReadingChapter(null)}
        onPlayAudio={
          readingChapter && readingChapter.audioUrl
            ? () => {
                setCurrentPlayingChapterId(readingChapter.id);
                setIsPlaying(true);
              }
            : undefined
        }
      />

      {/* How it Works Modal */}
      <HowItWorksModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

