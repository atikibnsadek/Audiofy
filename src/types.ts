export type Accent = 'american' | 'british';
export type VoiceGender = 'male' | 'female';
export type AppTheme = 'light' | 'dark' | 'rainbow';

export interface VoiceOption {
  id: string;
  name: string;
  accent: Accent;
  gender: VoiceGender;
  geminiVoice: string; // 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'
  description: string;
  sampleText: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary?: string;
  text: string;
  wordCount: number;
  estimatedMinutes: number;
  audioUrl?: string; // data url or blob url
  audioBase64?: string;
  audioDuration?: number;
  status: 'idle' | 'generating' | 'ready' | 'error';
  errorMessage?: string;
  isClientFallback?: boolean;
  voiceUsed?: string;
  accentUsed?: Accent;
  genderUsed?: VoiceGender;
}

export interface GeneratedAudioFile {
  id: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  bookTitle: string;
  accent: Accent;
  gender: VoiceGender;
  voiceName: string;
  audioUrl: string;
  audioBase64?: string;
  audioDuration: number;
  createdAt: number;
  isClientFallback?: boolean;
}

export interface BookProject {
  title: string;
  author?: string;
  totalChapters: number;
  chapters: Chapter[];
  accent: Accent;
  gender: VoiceGender;
  voiceId: string;
  sourceType: 'upload' | 'sample';
  fileName?: string;
}

export interface ExtractChaptersResponse {
  bookTitle: string;
  author?: string;
  chapters: {
    chapterNumber: number;
    title: string;
    summary?: string;
    text: string;
  }[];
}
