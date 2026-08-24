import JSZip from 'jszip';
import { Chapter, GeneratedAudioFile } from '../types';

export function downloadSingleAudio(chapter: Chapter, bookTitle: string) {
  if (!chapter.audioUrl) return;

  const sanitizedBook = (bookTitle || 'Audiobook').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedChapter = (chapter.title || `Chapter_${chapter.chapterNumber}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const accentLabel = chapter.accentUsed === 'british' ? 'British' : 'American';
  const genderLabel = chapter.genderUsed === 'female' ? 'Female' : 'Male';
  const filename = `${sanitizedBook}_Ch${chapter.chapterNumber.toString().padStart(2, '0')}_${sanitizedChapter}_${accentLabel}_${genderLabel}.wav`;

  const link = document.createElement('a');
  link.href = chapter.audioUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadGeneratedAudioFile(file: GeneratedAudioFile) {
  if (!file.audioUrl) return;

  const sanitizedBook = (file.bookTitle || 'Audiobook').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedChapter = (file.chapterTitle || `Chapter_${file.chapterNumber}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const accentLabel = file.accent === 'british' ? 'British' : 'American';
  const genderLabel = file.gender === 'female' ? 'Female' : 'Male';
  const filename = `${sanitizedBook}_Ch${file.chapterNumber.toString().padStart(2, '0')}_${sanitizedChapter}_${accentLabel}_${genderLabel}.wav`;

  const link = document.createElement('a');
  link.href = file.audioUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

  audioFiles.forEach((file, index) => {
    const paddedNum = file.chapterNumber.toString().padStart(2, '0');
    const sanitizedTitle = (file.chapterTitle || `Chapter_${file.chapterNumber}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const accentLabel = file.accent === 'british' ? 'British' : 'American';
    const genderLabel = file.gender === 'female' ? 'Female' : 'Male';
    const filename = `Ch${paddedNum}_${sanitizedTitle}_${accentLabel}_${genderLabel}_${file.id.slice(-4)}.wav`;

    manifest += `${index + 1}. [Ch ${file.chapterNumber}] ${file.chapterTitle} | ${accentLabel} ${genderLabel} (${file.voiceName}) | ${Math.round(file.audioDuration || 0)}s\n`;

    if (file.audioBase64) {
      folder.file(filename, file.audioBase64, { base64: true });
    } else if (file.audioUrl && file.audioUrl.startsWith('data:audio/wav;base64,')) {
      const base64Data = file.audioUrl.replace('data:audio/wav;base64,', '');
      folder.file(filename, base64Data, { base64: true });
    }

    if (onProgress) {
      onProgress(Math.round(((index + 1) / audioFiles.length) * 50));
    }
  });

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
  URL.revokeObjectURL(url);
}

export async function downloadAllChaptersAsZip(
  chapters: Chapter[],
  bookTitle: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const readyChapters = chapters.filter((ch) => ch.audioBase64 || ch.audioUrl);
  if (readyChapters.length === 0) return;

  const zip = new JSZip();
  const sanitizedBook = bookTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const folder = zip.folder(sanitizedBook) || zip;

  // Add metadata summary file
  let playlistManifest = `AUDIOBOOK PLAYLIST: ${bookTitle}\n`;
  playlistManifest += `Generated on: ${new Date().toLocaleDateString()}\n`;
  playlistManifest += `Total Chapters: ${readyChapters.length}\n\n`;

  readyChapters.forEach((ch, index) => {
    const paddedNum = ch.chapterNumber.toString().padStart(2, '0');
    const sanitizedTitle = ch.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Chapter_${paddedNum}_${sanitizedTitle}.wav`;

    playlistManifest += `${paddedNum}. ${ch.title} (${Math.round(ch.audioDuration || 0)}s)\n`;

    if (ch.audioBase64) {
      folder.file(filename, ch.audioBase64, { base64: true });
    } else if (ch.audioUrl && ch.audioUrl.startsWith('data:audio/wav;base64,')) {
      const base64Data = ch.audioUrl.replace('data:audio/wav;base64,', '');
      folder.file(filename, base64Data, { base64: true });
    }

    if (onProgress) {
      onProgress(Math.round(((index + 1) / readyChapters.length) * 50));
    }
  });

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
  URL.revokeObjectURL(url);
}
