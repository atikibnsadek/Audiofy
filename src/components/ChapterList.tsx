import React from 'react';
import { Chapter, AppTheme } from '../types';
import {
  Play,
  Pause,
  Download,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Archive,
  Volume2,
  Sparkles,
  Square,
  RotateCcw,
} from 'lucide-react';

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
  bookTitle,
  currentPlayingChapterId,
  isPlaying,
  onPlayChapter,
  onPause,
  onGenerateSingleChapter,
  onStopSingleChapter,
  onGenerateAllChapters,
  onStopAllGeneration,
  onDownloadSingle,
  onDownloadAllZip,
  onOpenReader,
  onDeleteChapter,
  isGeneratingAll,
  zipProgress,
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
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors duration-300 ${
        isDark
          ? 'border-stone-800 bg-stone-900 shadow-md text-stone-100'
          : isRainbow
          ? 'border-pink-200/80 bg-white/90 shadow-md shadow-pink-100/50 text-slate-800'
          : 'border-stone-200 bg-white shadow-xs text-stone-900'
      }`}
    >
      {/* Header & Batch Controls */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
          isDark ? 'border-stone-800' : isRainbow ? 'border-pink-100' : 'border-stone-100'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={`text-base font-semibold ${
                isDark
                  ? 'text-stone-100'
                  : isRainbow
                  ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold'
                  : 'text-stone-900'
              }`}
            >
              Book Chapters ({totalCount})
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isDark
                  ? 'bg-stone-800 text-stone-300'
                  : isRainbow
                  ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-900 border border-purple-200/60 font-semibold'
                  : 'bg-stone-100 text-stone-700'
              }`}
            >
              {readyCount}/{totalCount} Generated
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : isRainbow ? 'text-slate-600' : 'text-stone-500'}`}>
            Individual audio file generated for every chapter
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {isGeneratingAll ? (
            <button
              id="stop-generating-all-btn"
              type="button"
              onClick={onStopAllGeneration}
              className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-500/10 text-rose-600 px-4 py-2 text-xs font-semibold shadow-xs hover:bg-rose-500/20 transition-all animate-pulse"
              title="Stop audio generation"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop Generating</span>
            </button>
          ) : (
            totalCount > 0 && (
              <button
                id="generate-all-chapters-btn"
                type="button"
                disabled={totalCount === 0}
                onClick={onGenerateAllChapters}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs disabled:opacity-50 transition-all ${
                  isDark
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : isRainbow
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:opacity-95 shadow-md shadow-purple-500/20'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
                title={readyCount === totalCount ? 'Regenerate all chapters with current voice' : 'Generate audio for all chapters'}
              >
                {readyCount === totalCount ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Regenerate All</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>
                      {readyCount > 0
                        ? `Generate Remaining (${totalCount - readyCount})`
                        : 'Generate All Chapters'}
                    </span>
                  </>
                )}
              </button>
            )
          )}

          {onOpenAudioDownloads && (storedAudioCount > 0 || readyCount > 0) && (
            <button
              id="open-audio-downloads-btn"
              type="button"
              onClick={onOpenAudioDownloads}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shadow-2xs group ${
                isDark
                  ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 hover:border-stone-600'
                  : isRainbow
                  ? 'border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 text-purple-900 hover:from-pink-100 hover:to-purple-100 hover:border-pink-300 font-semibold'
                  : 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100 hover:border-stone-300'
              }`}
              title="Open Generated Audio Downloads Library"
            >
              <Archive className={`h-3.5 w-3.5 ${isRainbow ? 'text-pink-500' : 'text-stone-500'}`} />
              <span>
                Audio Downloads ({storedAudioCount > 0 ? storedAudioCount : readyCount})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Chapters Cards */}
      <div className="mt-4 space-y-3">
        {chapters.map((chapter) => {
          const isCurrentlyActive = currentPlayingChapterId === chapter.id;
          const isCurrentlyPlaying = isCurrentlyActive && isPlaying;
          const isReady = chapter.status === 'ready' || Boolean(chapter.audioUrl);
          const isGenerating = chapter.status === 'generating';
          const isError = chapter.status === 'error';

          return (
            <div
              key={chapter.id}
              id={`chapter-card-${chapter.chapterNumber}`}
              className={`rounded-xl border p-4 transition-all ${
                isCurrentlyActive
                  ? isDark
                    ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/40 shadow-xs'
                    : isRainbow
                    ? 'border-purple-300 bg-gradient-to-r from-pink-50/90 via-purple-50/90 to-indigo-50/90 ring-1 ring-purple-300 shadow-xs'
                    : 'border-stone-900 bg-stone-50/90 shadow-xs'
                  : isDark
                  ? 'border-stone-800 bg-stone-950/60 hover:border-stone-700 hover:bg-stone-800/40'
                  : isRainbow
                  ? 'border-purple-100/90 bg-white/95 hover:border-purple-200 hover:bg-pink-50/30'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left info */}
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isReady
                        ? isDark
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : isRainbow
                          ? 'bg-gradient-to-tr from-emerald-400 to-teal-400 text-white shadow-2xs'
                          : 'bg-emerald-100 text-emerald-800'
                        : isGenerating
                        ? isDark
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : isRainbow
                          ? 'bg-gradient-to-tr from-amber-400 to-orange-400 text-white'
                          : 'bg-amber-100 text-amber-800'
                        : isDark
                        ? 'bg-stone-800 text-stone-300'
                        : isRainbow
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {chapter.chapterNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-semibold ${
                          isDark ? 'text-stone-100' : isRainbow ? 'text-slate-900 font-bold' : 'text-stone-900'
                        }`}
                      >
                        {chapter.title}
                      </h4>
                      {isReady && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              isDark ? 'text-emerald-400' : isRainbow ? 'text-emerald-700 font-semibold' : 'text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Audio Ready</span>
                          </span>
                          {(chapter.accentUsed || chapter.genderUsed) && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                isDark
                                  ? 'bg-stone-800 text-stone-300'
                                  : isRainbow
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {chapter.accentUsed === 'british' ? '🇬🇧 British' : '🇺🇸 American'}{' '}
                              {chapter.genderUsed === 'female' ? 'Female' : 'Male'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {chapter.summary && (
                      <p className={`text-xs mt-0.5 line-clamp-1 ${isDark ? 'text-stone-400' : isRainbow ? 'text-slate-600' : 'text-stone-500'}`}>
                        {chapter.summary}
                      </p>
                    )}

                    <div className={`flex items-center gap-3 mt-1 text-[11px] ${isDark ? 'text-stone-500' : isRainbow ? 'text-purple-600/70' : 'text-stone-400'}`}>
                      <span>{chapter.wordCount} words</span>
                      <span>•</span>
                      <span>
                        {isReady && chapter.audioDuration
                          ? formatDuration(chapter.audioDuration)
                          : `~${chapter.estimatedMinutes} min read`}
                      </span>
                    </div>

                    {isError && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{chapter.errorMessage || 'Audio generation error'}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Read text modal */}
                  <button
                    id={`read-chapter-${chapter.chapterNumber}`}
                    type="button"
                    onClick={() => onOpenReader(chapter)}
                    title="Read text"
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isDark
                        ? 'border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100'
                        : isRainbow
                        ? 'border-purple-200 bg-white text-purple-900 hover:bg-purple-50'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Text</span>
                  </button>

                  {/* Delete chapter button */}
                  <button
                    id={`delete-chapter-${chapter.chapterNumber}`}
                    type="button"
                    onClick={() => onDeleteChapter(chapter.id)}
                    title="Delete Chapter"
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isDark
                        ? 'border-stone-800 bg-stone-900 text-stone-400 hover:bg-rose-950/60 hover:border-rose-800 hover:text-rose-400'
                        : isRainbow
                        ? 'border-purple-200 bg-white text-purple-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
                        : 'border-stone-200 bg-white text-stone-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  {/* Action buttons depending on state */}
                  {isGenerating ? (
                    /* If Generating / Regenerating -> Stop Button */
                    <button
                      id={`stop-chapter-${chapter.chapterNumber}`}
                      type="button"
                      onClick={() => onStopSingleChapter?.(chapter.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/20 transition-all shadow-xs"
                      title="Stop generating this chapter"
                    >
                      <Square className="h-3.5 w-3.5 fill-current text-rose-600" />
                      <span>Stop</span>
                    </button>
                  ) : isReady ? (
                    /* If Audio is ready -> Play, Regenerate, and Save */
                    <>
                      {/* Play Button */}
                      <button
                        id={`play-chapter-${chapter.chapterNumber}`}
                        type="button"
                        onClick={() => {
                          if (isCurrentlyPlaying) {
                            onPause();
                          } else {
                            onPlayChapter(chapter);
                          }
                        }}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          isCurrentlyPlaying
                            ? isDark
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : isRainbow
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xs'
                              : 'bg-stone-900 text-white shadow-xs'
                            : isDark
                            ? 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                            : isRainbow
                            ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-950 hover:from-pink-200 hover:to-purple-200 font-semibold'
                            : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <>
                            <Pause className="h-3.5 w-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Play</span>
                          </>
                        )}
                      </button>

                      {/* Regenerate Button */}
                      <button
                        id={`regenerate-chapter-${chapter.chapterNumber}`}
                        type="button"
                        disabled={isGeneratingAll}
                        onClick={() => onGenerateSingleChapter(chapter.id)}
                        title="Regenerate Chapter Audio with current voice settings"
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors shadow-2xs disabled:opacity-50 ${
                          isDark
                            ? 'border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100'
                            : isRainbow
                            ? 'border-purple-200 bg-white text-purple-900 hover:bg-purple-50 font-medium'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${isDark ? 'text-stone-400' : isRainbow ? 'text-purple-600' : 'text-stone-500'}`} />
                        <span className="hidden sm:inline">Regenerate</span>
                      </button>

                      {/* Download Single Chapter */}
                      <button
                        id={`download-chapter-${chapter.chapterNumber}`}
                        type="button"
                        onClick={() => onDownloadSingle(chapter)}
                        title="Download Chapter Audio (.wav)"
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isDark
                            ? 'border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100'
                            : isRainbow
                            ? 'border-purple-200 bg-white text-purple-900 hover:bg-purple-50'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                    </>
                  ) : (
                    /* If Audio is not yet generated -> Generate Audio */
                    <button
                      id={`generate-chapter-${chapter.chapterNumber}`}
                      type="button"
                      disabled={isGeneratingAll}
                      onClick={() => onGenerateSingleChapter(chapter.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shadow-xs disabled:opacity-50 transition-all ${
                        isDark
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : isRainbow
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-95'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Generate Audio</span>
                    </button>
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

