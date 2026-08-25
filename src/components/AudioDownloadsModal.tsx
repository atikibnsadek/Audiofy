import React, { useState } from 'react';
import { GeneratedAudioFile } from '../types';
import { downloadGeneratedAudioFile, downloadStoredAudiosAsZip } from '../utils/audioDownloader';
import { X, Download, Trash2, Play, Pause, Archive, Search, Volume2, Clock, Filter } from 'lucide-react';

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
  const [accent, setAccent] = useState<'all' | 'american' | 'british'>('all');
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const filteredFiles = audioFiles.filter((file) => {
    const q = searchQuery.toLowerCase();
    return (
      (file.chapterTitle.toLowerCase().includes(q) || file.chapterNumber.toString().includes(q) || file.voiceName.toLowerCase().includes(q)) &&
      (accent === 'all' || file.accent === accent) &&
      (gender === 'all' || file.gender === gender)
    );
  });

  const downloadableFiles = filteredFiles.filter((file) => file.isDownloadable !== false && !file.isClientFallback && Boolean(file.audioBase64 || file.audioUrl));

  const downloadAll = async () => {
    if (!downloadableFiles.length) return;
    setZipProgress(0);
    try {
      await downloadStoredAudiosAsZip(downloadableFiles, bookTitle, setZipProgress);
    } finally {
      setTimeout(() => setZipProgress(null), 1000);
    }
  };

  const duration = (seconds?: number) => {
    if (!seconds) return '0:00';
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white"><Archive className="h-5 w-5" /></div>
            <div><h3 className="text-lg font-bold text-stone-900">Generated Audio Files</h3><p className="text-xs text-stone-500">Playable files and live-only browser fallback audio.</p></div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-200"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-3 border-b border-stone-100 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search chapter or voice..." className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-stone-400" />
            </div>
            <button type="button" disabled={!downloadableFiles.length} onClick={downloadAll} className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
              <Download className="h-3.5 w-3.5" />{zipProgress !== null ? `Zipping ${zipProgress}%` : `Download All ZIP (${downloadableFiles.length})`}
            </button>
            {confirmClear ? <div className="flex gap-1"><button type="button" onClick={() => { onClearAllAudioFiles(); setConfirmClear(false); }} className="rounded-xl bg-rose-600 px-2.5 py-2 text-xs font-semibold text-white">Confirm</button><button type="button" onClick={() => setConfirmClear(false)} className="rounded-xl border px-2.5 py-2 text-xs">Cancel</button></div> : <button type="button" onClick={() => setConfirmClear(true)} className="flex items-center gap-1 rounded-xl border border-stone-200 px-2.5 py-2 text-xs text-rose-600"><Trash2 className="h-3.5 w-3.5" />Clear All</button>}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-stone-400"><Filter className="h-3 w-3" />Filters:</span>
            {(['all', 'american', 'british'] as const).map((value) => <button key={value} type="button" onClick={() => setAccent(value)} className={`rounded-lg px-2.5 py-1 ${accent === value ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>{value === 'all' ? 'All Accents' : value === 'american' ? '🇺🇸 American' : '🇬🇧 British'}</button>)}
            <span className="text-stone-300">|</span>
            {(['all', 'male', 'female'] as const).map((value) => <button key={value} type="button" onClick={() => setGender(value)} className={`rounded-lg px-2.5 py-1 ${gender === value ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>{value === 'all' ? 'All Voices' : value === 'male' ? '♂ Male' : '♀ Female'}</button>)}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {!filteredFiles.length ? <div className="py-12 text-center"><Volume2 className="mx-auto h-8 w-8 text-stone-300" /><p className="mt-3 text-sm font-semibold text-stone-700">No audio files found</p></div> : filteredFiles.map((file) => {
            const liveOnly = file.isClientFallback || file.isDownloadable === false;
            const playable = Boolean(file.audioUrl || file.audioBase64);
            const thisPlaying = Boolean(isPlaying && currentlyPlayingId === file.id);
            return (
              <div key={file.id} className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${thisPlaying ? 'border-emerald-300 bg-emerald-50/50' : 'border-stone-200 bg-white'}`}>
                <div className="flex items-start gap-3.5 min-w-0">
                  <button type="button" disabled={!playable} onClick={() => onPlayAudioFile(file)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white disabled:opacity-30">{thisPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}</button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-800">Ch {file.chapterNumber}</span><h4 className="truncate text-sm font-semibold text-stone-900">{file.chapterTitle}</h4></div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-500"><span>{file.accent === 'british' ? '🇬🇧 British' : '🇺🇸 American'} {file.gender === 'female' ? 'Female' : 'Male'}</span><span>•</span><span>{file.voiceName}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{duration(file.audioDuration)}</span></div>
                    {liveOnly && <p className="mt-1 text-[10px] text-amber-600">Live browser speech only — no downloadable audio file was generated.</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button type="button" disabled={liveOnly} onClick={() => downloadGeneratedAudioFile(file)} className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 disabled:cursor-not-allowed disabled:text-stone-400" title={liveOnly ? 'No downloadable audio file exists for this live fallback' : 'Download generated WAV'}><Download className="h-3.5 w-3.5" />{liveOnly ? 'Live Only' : 'Download'}</button>
                  <button type="button" onClick={() => onDeleteAudioFile(file.id)} className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600" title="Delete this audio entry"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/60 px-6 py-4 text-xs text-stone-500"><span>Showing <strong className="text-stone-800">{filteredFiles.length}</strong> of <strong className="text-stone-800">{audioFiles.length}</strong> entries</span><button type="button" onClick={onClose} className="rounded-xl border border-stone-200 bg-white px-4 py-1.5 font-semibold text-stone-700">Done</button></div>
      </div>
    </div>
  );
};