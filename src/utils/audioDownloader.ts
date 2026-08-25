import JSZip from 'jszip';
import { Chapter, GeneratedAudioFile } from '../types';

/**
 * Safely resolves any combination of base64 string or audioUrl (blob:, data:, http) into a clean, uncorrupted audio Blob.
 */
async function resolveAudioBlob(audioBase64?: string, audioUrl?: string, audioMimeType?: string): Promise<Blob | null> {
  // 1. Prefer direct browser fetching of data: or blob: or http: URLs for byte-accurate Blobs
  if (audioUrl && (audioUrl.startsWith('blob:') || audioUrl.startsWith('data:') || audioUrl.startsWith('http'))) {
    try {
      const res = await fetch(audioUrl);
      if (res.ok) {
        const b = await res.blob();
        if (b && b.size > 0) {
          return b;
        }
      }
    } catch (err) {
      console.warn('Direct fetch of audioUrl failed, falling back to base64 decode:', err);
    }
  }

  // 2. Fallback to base64 decoding with strict data-URI header stripping and whitespace sanitization
  const rawString = audioBase64 || (audioUrl?.startsWith('data:') ? audioUrl : '');
  if (rawString) {
    const cleanB64 = rawString.replace(/^data:[^;]+;base64,/, '').replace(/[\r\n\s]/g, '');
    if (cleanB64.length > 0) {
      try {
        const binaryString = atob(cleanB64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return new Blob([bytes.buffer], { type: audioMimeType || 'audio/wav' });
      } catch (err) {
        console.error('Base64 decode failed for audio download:', err);
      }
    }
  }

  return null;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function downloadSingleAudio(chapter: Chapter, bookTitle: string): Promise<void> {
  if ((!chapter.audioUrl && !chapter.audioBase64) || chapter.isDownloadable === false) return;

  try {
    const blob = await resolveAudioBlob(chapter.audioBase64, chapter.audioUrl, chapter.audioMimeType);
    if (!blob || blob.size === 0) {
      console.warn('No valid audio blob found for chapter download');
      return;
    }

    const sanitizedBook = (bookTitle || 'Audiobook').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedChapter = (chapter.title || `Chapter_${chapter.chapterNumber}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const accentLabel = chapter.accentUsed === 'british' ? 'British' : 'American';
    const genderLabel = chapter.genderUsed === 'female' ? 'Female' : 'Male';
    const extension = chapter.audioFileExtension || (chapter.audioMimeType === 'audio/wav' ? 'wav' : 'mp3');
    const filename = `${sanitizedBook}_Ch${chapter.chapterNumber.toString().padStart(2, '0')}_${sanitizedChapter}_${accentLabel}_${genderLabel}.${extension}`;

    triggerBlobDownload(blob, filename);
  } catch (err) {
    console.error('Failed to download single audio file:', err);
  }
}

export async function downloadGeneratedAudioFile(file: GeneratedAudioFile): Promise<void> {
  if ((!file.audioUrl && !file.audioBase64) || file.isDownloadable === false) return;

  try {
    const blob = await resolveAudioBlob(file.audioBase64, file.audioUrl, file.audioMimeType);
    if (!blob || blob.size === 0) {
      console.warn('No valid audio blob found for generated audio download');
      return;
    }

    const sanitizedBook = (file.bookTitle || 'Audiobook').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedChapter = (file.chapterTitle || `Chapter_${file.chapterNumber}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const accentLabel = file.accent === 'british' ? 'British' : 'American';
    const genderLabel = file.gender === 'female' ? 'Female' : 'Male';
    const extension = file.audioFileExtension || (file.audioMimeType === 'audio/wav' ? 'wav' : 'mp3');
    const filename = `${sanitizedBook}_Ch${file.chapterNumber.toString().padStart(2, '0')}_${sanitizedChapter}_${accentLabel}_${genderLabel}.${extension}`;

    triggerBlobDownload(blob, filename);
  } catch (err) {
    console.error('Failed to download generated audio file:', err);
  }
}

export async function downloadStoredAudiosAsZip(
  audioFiles: GeneratedAudioFile[],
  bookTitle: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (audioFiles.length === 0) return;

  const zip = new JSZip();
  const sanitizedBook = (bookTitle || 'Audiobook').replace(/[^a-zA-Z0-9_-]/g, '_');
  const folder = zip.folder(sanitizedBook) || zip;

  let manifest = `AUDIOBOOK DOWNLOAD ARCHIVE: ${bookTitle}\n`;
  manifest += `Exported on: ${new Date().toLocaleString()}\n`;
  manifest += `Total Audio Files Stored: ${audioFiles.length}\n\n`;

  for (let index = 0; index < audioFiles.length; index++) {
    const file = audioFiles[index];
    const paddedNum = file.chapterNumber.toString().padStart(2, '0');
    const sanitizedTitle = (file.chapterTitle || `Chapter_${file.chapterNumber}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const accentLabel = file.accent === 'british' ? 'British' : 'American';
    const genderLabel = file.gender === 'female' ? 'Female' : 'Male';
    if (file.isDownloadable === false) continue;
    const extension = file.audioFileExtension || (file.audioMimeType === 'audio/wav' ? 'wav' : 'mp3');
    const filename = `Ch${paddedNum}_${sanitizedTitle}_${accentLabel}_${genderLabel}_${file.id.slice(-4)}.${extension}`;

    manifest += `${index + 1}. [Ch ${file.chapterNumber}] ${file.chapterTitle} | ${accentLabel} ${genderLabel} (${file.voiceName}) | ${Math.round(file.audioDuration || 0)}s\n`;

    const blob = await resolveAudioBlob(file.audioBase64, file.audioUrl, file.audioMimeType);
    if (blob) {
      const arrayBuf = await blob.arrayBuffer();
      folder.file(filename, arrayBuf);
    }

    if (onProgress) {
      onProgress(Math.round(((index + 1) / audioFiles.length) * 50));
    }
  }

  folder.file('Archive_Manifest.txt', manifest);

  const zipBlob = await zip.generateAsync(
    { type: 'blob' },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent * 0.5));
      }
    }
  );

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizedBook}_Audio_Downloads_${audioFiles.length}_files.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function downloadAllChaptersAsZip(
  chapters: Chapter[],
  bookTitle: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const readyChapters = chapters.filter((ch) => (ch.audioBase64 || ch.audioUrl) && ch.isDownloadable !== false);
  if (readyChapters.length === 0) return;

  const zip = new JSZip();
  const sanitizedBook = (bookTitle || 'Audiobook').replace(/[^a-zA-Z0-9_-]/g, '_');
  const folder = zip.folder(sanitizedBook) || zip;

  let playlistManifest = `AUDIOBOOK PLAYLIST: ${bookTitle}\n`;
  playlistManifest += `Generated on: ${new Date().toLocaleDateString()}\n`;
  playlistManifest += `Total Chapters: ${readyChapters.length}\n\n`;

  for (let index = 0; index < readyChapters.length; index++) {
    const ch = readyChapters[index];
    const paddedNum = ch.chapterNumber.toString().padStart(2, '0');
    const sanitizedTitle = ch.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = ch.audioFileExtension || (ch.audioMimeType === 'audio/wav' ? 'wav' : 'mp3');
    const filename = `Chapter_${paddedNum}_${sanitizedTitle}.${extension}`;

    playlistManifest += `${paddedNum}. ${ch.title} (${Math.round(ch.audioDuration || 0)}s)\n`;

    const blob = await resolveAudioBlob(ch.audioBase64, ch.audioUrl, ch.audioMimeType);
    if (blob) {
      const arrayBuf = await blob.arrayBuffer();
      folder.file(filename, arrayBuf);
    }

    if (onProgress) {
      onProgress(Math.round(((index + 1) / readyChapters.length) * 50));
    }
  }

  folder.file('Playlist_Info.txt', playlistManifest);

  const zipBlob = await zip.generateAsync(
    { type: 'blob' },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent * 0.5));
      }
    }
  );

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizedBook}_Audiobook_Chapters.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
