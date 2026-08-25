import React, { useState } from 'react';
import { GeneratedAudioFile } from '../types';
import { downloadGeneratedAudioFile, downloadStoredAudiosAsZip } from '../utils/audioDownloader';
import {
  X,
  Download,
  Trash2,
  Play,
  Pause,
  Archive,
  Search,
  Volume2,
  Sparkles,
  Music,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';

interface AudioDownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioFiles: GeneratedAudioFile[];
  bookTitle: string;
  onDeleteAudioFile: (id: string) => void;
  onClearAllAudioFiles: () => void;
  onPlayAudioFile: (file: GeneratedAudioFile) => void;
  currentlyPlayingId?: string | null;
  isPlaying?: boolean;
}

export const AudioDownloadsModal: React.FC<AudioDownloadsModalProps> = ({
  isOpen,
  onClose,
  audioFiles,
  bookTitle,
  onDeleteAudioFile,
  onClearAllAudioFiles,
  onPlayAudioFile,
  currentlyPlayingId,
  isPlaying,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccentFilter, setSelectedAccentFilter] = useState<'all' | 'american' | 'british'>('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  // Filter audio files based on search & filters
  const filteredFiles = audioFiles.filter((file) => {
    const matchesSearch =
      file.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.chapterNumber.toString().includes(searchQuery) ||
      file.voiceName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAccent =
      selectedAccentFilter === 'all' || file.accent === selectedAccentFilter;

    const matchesGender =
      selectedGenderFilter === 'all' || file.gender === selectedGenderFilter;

    return matchesSearch && matchesAccent && matchesGender;
  });

  const downloadableFiles = filteredFiles.filter((file) => file.isDownloadable !== false);

  const handleDownloadAll = async () => {
    if (downloadableFiles.length === 0) return;
    setZipProgress(0);
    try {
      await downloadStoredAudiosAsZip(downloadableFiles, bookTitle, (pct) => setZipProgress(pct));
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setTimeout(() => setZipProgress(null), 1200);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-xs">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-stone-900">
                  Generated Audio Files
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  {audioFiles.length} {audioFiles.length === 1 ? 'File' : 'Files'} Stored
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Every generated chapter & voice variation is preserved here until deleted
              </p>
            </div>
          </div>

          <button
            id="close-audio-downloads-btn"
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar: Search, Filters, and Batch Actions */}
        <div className="border-b border-stone-100 px-6 py-3.5 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapter title, number, or voice..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:border-stone-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center gap-2">
              {audioFiles.length > 0 && (
                <>
                  <button
                    id="download-all-stored-zip-btn"
                    type="button"
                    onClick={handleDownloadAll}
                    disabled={downloadableFiles.length === 0}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-stone-200" />
                    <span>
                      {zipProgress !== null
                        ? `Zipping ${zipProgress}%`
                        : `Download All ZIP (${downloadableFiles.length})`}
                    </span>
                  </button>

                  {confirmClearAll ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClearAllAudioFiles();
                          setConfirmClearAll(false);
                        }}
                        className="rounded-xl bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-2xs"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(false)}
                        className="rounded-xl border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                      title="Clear all stored audio files"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-stone-400 font-medium flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3" /> Filters:
            </span>

            {/* Accent Filters */}
            <button
              type="button"
              onClick={() => setSelectedAccentFilter('all')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedAccentFilter === 'all'
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Accents
            </button>
            <button
              type="button"
              onClick={() => setSelectedAccentFilter('american')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                selectedAccentFilter === 'american'
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>🇺🇸</span>
              <span>American</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedAccentFilter('british')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${
                selectedAccentFilter === 'british'
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>🇬🇧</span>
              <span>British</span>
            </button>

            <span className="text-stone-300">|</span>

            {/* Gender Filters */}
            <button
              type="button"
              onClick={() => setSelectedGenderFilter('all')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedGenderFilter === 'all'
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Voices
            </button>
            <button
              type="button"
              onClick={() => setSelectedGenderFilter('male')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedGenderFilter === 'male'
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              ♂ Male
            </button>
            <button
              type="button"
              onClick={() => setSelectedGenderFilter('female')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                selectedGenderFilter === 'female'
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              ♀ Female
            </button>
          </div>
        </div>

        {/* Scrollable File List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[55vh]">
          {filteredFiles.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Volume2 className="h-7 w-7" />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-stone-800">
                {audioFiles.length === 0
                  ? 'No audio files generated yet'
                  : 'No audio files match your filters'}
              </h4>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                {audioFiles.length === 0
                  ? 'Generate audio for any chapter with any voice option (American/British, Male/Female). All variations will be stored here permanently until deleted.'
                  : 'Try adjusting your search terms or filters above to see more files.'}
              </p>
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isThisPlaying = isPlaying && currentlyPlayingId === file.id;

              return (
                <div
                  key={file.id}
                  id={`stored-audio-item-${file.id}`}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                    isThisPlaying
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-400/30'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
                  }`}
                >
                  {/* Left Info */}
                  <div className="flex items-start gap-3.5">
                    {/* Play / Listen Button */}
                    <button
                      type="button"
                      onClick={() => onPlayAudioFile(file)}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform active:scale-95 ${
                        isThisPlaying
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                      title={isThisPlaying ? 'Pause Audio' : 'Play Audio'}
                    >
                      {isThisPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div>
                      {/* Chapter Title & Number */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-800">
                          Ch {file.chapterNumber}
                        </span>
                        <h4 className="text-sm font-semibold text-stone-900">
                          {file.chapterTitle}
                        </h4>
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                          <span>{file.accent === 'british' ? '🇬🇧' : '🇺🇸'}</span>
                          <span>{file.accent === 'british' ? 'British' : 'American'}</span>
                          <span>{file.gender === 'female' ? 'Female' : 'Male'}</span>
                        </span>

                        <span className="text-xs text-stone-400">•</span>
                        <span className="text-[11px] font-medium text-stone-600">
                          {file.voiceName}
                        </span>

                        <span className="text-xs text-stone-400">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                          <Clock className="h-3 w-3 text-stone-400" />
                          <span>{formatDuration(file.audioDuration)}</span>
                        </span>

                        <span className="text-xs text-stone-400">•</span>
                        <span className="text-[10px] text-stone-400">
                          {formatTimestamp(file.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Download Single File */}
                    {file.isDownloadable !== false && <button
                      type="button"
                      onClick={() => downloadGeneratedAudioFile(file)}
                      className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100 hover:border-stone-300 transition-colors shadow-2xs"
                      title="Download this .WAV audio file"
                    >
                      <Download className="h-3.5 w-3.5 text-stone-600" />
                      <span>Download</span>
                    </button>}

                    {/* Delete Specific Audio File */}
                    <button
                      type="button"
                      onClick={() => onDeleteAudioFile(file.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Delete this audio file permanently"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="border-t border-stone-100 px-6 py-4 bg-stone-50/60 flex items-center justify-between text-xs text-stone-500">
          <div>
            Showing <strong className="text-stone-800">{filteredFiles.length}</strong> of{' '}
            <strong className="text-stone-800">{audioFiles.length}</strong> total saved audio variations
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-4 py-1.5 font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
