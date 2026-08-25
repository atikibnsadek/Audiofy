import React from 'react';
import { Chapter, AppTheme } from '../types';
import { Play, Pause, Download, FileText, Trash2, CheckCircle2, AlertCircle, Archive, Volume2, Sparkles, Square, RotateCcw } from 'lucide-react';

interface ChapterListProps {
  chapters: Chapter[];
  bookTitle: string;
  currentPlayingChapterId: string | null;
  isPlaying: boolean;
  onPlayChapter: (chapter: Chapter) => void;
  onPause: () => void;
  onGenerateSingleChapter: (chapterId: string) => void;
  onStopSingleChapter?: (chapterId: string) => void;
  onGenerateAllChapters: () => void;
  onStopAllGeneration?: () => void;
  onDownloadSingle: (chapter: Chapter) => void;
  onDownloadAllZip?: () => void;
  onOpenReader: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  isGeneratingAll: boolean;
  zipProgress?: number | null;
  storedAudioCount?: number;
  onOpenAudioDownloads?: () => void;
  theme?: AppTheme;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  currentPlayingChapterId,
  isPlaying,
  onPlayChapter,
  onPause,
  onGenerateSingleChapter,
  onStopSingleChapter,
  onGenerateAllChapters,
  onStopAllGeneration,
  onDownloadSingle,
  onOpenReader,
  onDeleteChapter,
  isGeneratingAll,
  storedAudioCount = 0,
  onOpenAudioDownloads,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const isRainbow = theme === 'rainbow';
  const readyCount = chapters.filter((c) => c.status === 'ready' || Boolean(c.audioUrl)).length;
  const totalCount = chapters.length;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  };

  const secondaryButton = isDark
    ? 'border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700'
    : isRainbow
      ? 'border-purple-200 bg-white text-purple-900 hover:bg-purple-50'
      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100';

  return (
    <div className={`rounded-2xl border p-5 ${isDark ? 'border-stone-800 bg-stone-900 text-stone-100' : isRainbow ? 'border-pink-200 bg-white/90 text-slate-800' : 'border-stone-200 bg-white text-stone-900'}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Book Chapters ({totalCount})</h3>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">{readyCount}/{totalCount} Generated</span>
          </div>
          <p className="text-xs mt-0.5 text-stone-500">Individual audio file generated for every chapter</p>
        </div>
        <div className="flex items-center gap-2">
          {isGeneratingAll ? (
            <button type="button" onClick={onStopAllGeneration} className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-600"><Square className="h-3.5 w-3.5 fill-current" />Stop Generating</button>
          ) : totalCount > 0 ? (
            <button type="button" onClick={onGenerateAllChapters} className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800">
              {readyCount === totalCount ? <><RotateCcw className="h-3.5 w-3.5" />Regenerate All</> : <><Sparkles className="h-3.5 w-3.5 text-amber-300" />{readyCount ? `Generate Remaining (${totalCount - readyCount})` : 'Generate All Chapters'}</>}
            </button>
          ) : null}
          {onOpenAudioDownloads && (storedAudioCount > 0 || readyCount > 0) && (
            <button type="button" onClick={onOpenAudioDownloads} className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold ${secondaryButton}`}>
              <Archive className="h-3.5 w-3.5" />Audio Downloads ({storedAudioCount > 0 ? storedAudioCount : readyCount})
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {chapters.map((chapter) => {
          const isReady = chapter.status === 'ready' || Boolean(chapter.audioUrl);
          const isGenerating = chapter.status === 'generating';
          const isError = chapter.status === 'error';
          const isPlayingThis = currentPlayingChapterId === chapter.id && isPlaying;
          const isBrowserFallback = chapter.isClientFallback === true;
          const canDownload = isReady && !isBrowserFallback && chapter.isDownloadable !== false && Boolean(chapter.audioBase64 || chapter.audioUrl);

          return (
            <div key={chapter.id} id={`chapter-card-${chapter.chapterNumber}`} className={`rounded-xl border p-4 ${currentPlayingChapterId === chapter.id ? 'border-stone-900 bg-stone-50' : isDark ? 'border-stone-800 bg-stone-950/60' : 'border-stone-200 bg-white'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isReady ? 'bg-emerald-100 text-emerald-800' : isGenerating ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>{chapter.chapterNumber}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold truncate">{chapter.title}</h4>
                      {isReady && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" />{isBrowserFallback ? 'Live Audio Ready' : 'Audio Ready'}</span>}
                      {isReady && (chapter.accentUsed || chapter.genderUsed) && <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">{chapter.accentUsed === 'british' ? '🇬🇧 British' : '🇺🇸 American'} {chapter.genderUsed === 'female' ? 'Female' : 'Male'}</span>}
                    </div>
                    {chapter.summary && <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{chapter.summary}</p>}
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-stone-400"><span>{chapter.wordCount} words</span><span>•</span><span>{isReady && chapter.audioDuration ? formatDuration(chapter.audioDuration) : `~${chapter.estimatedMinutes} min read`}</span></div>
                    {isBrowserFallback && <p className="mt-1 text-[10px] text-amber-600">Browser speech is live-only. A real download appears when Gemini returns an audio file.</p>}
                    {isError && <p className="mt-1 flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="h-3 w-3" />{chapter.errorMessage || 'Audio generation error'}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center justify-end">
                  <button type="button" onClick={() => onOpenReader(chapter)} title="Read text" className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${secondaryButton}`}><FileText className="h-3.5 w-3.5" /><span>Text</span></button>
                  <button type="button" onClick={() => onDeleteChapter(chapter.id)} title="Delete chapter" className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${secondaryButton}`}><Trash2 className="h-3.5 w-3.5" /><span>Delete</span></button>

                  {isGenerating ? (
                    <button type="button" onClick={() => onStopSingleChapter?.(chapter.id)} className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600"><Square className="h-3.5 w-3.5 fill-current" />Stop</button>
                  ) : isReady ? (
                    <>
                      <button type="button" onClick={() => isPlayingThis ? onPause() : onPlayChapter(chapter)} className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-900 hover:bg-stone-200">
                        {isPlayingThis ? <><Pause className="h-3.5 w-3.5" />Pause</> : <><Play className="h-3.5 w-3.5 fill-current" />Play</>}
                      </button>
                      <button type="button" disabled={isGeneratingAll} onClick={() => onGenerateSingleChapter(chapter.id)} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${secondaryButton}`}><RotateCcw className="h-3.5 w-3.5" />Regenerate</button>
                      <button
                        id={`download-chapter-${chapter.chapterNumber}`}
                        type="button"
                        disabled={!canDownload}
                        onClick={() => onDownloadSingle(chapter)}
                        title={canDownload ? 'Download generated WAV audio' : 'This chapter is using live browser speech; there is no downloadable audio file yet.'}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${canDownload ? secondaryButton : 'cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400'}`}
                      >
                        <Download className="h-3.5 w-3.5" />{canDownload ? 'Download' : 'Live Only'}
                      </button>
                    </>
                  ) : (
                    <button type="button" disabled={isGeneratingAll} onClick={() => onGenerateSingleChapter(chapter.id)} className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50"><Volume2 className="h-3.5 w-3.5" />Generate Audio</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};