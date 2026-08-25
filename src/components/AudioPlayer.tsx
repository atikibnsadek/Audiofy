import React, { useRef, useState, useEffect } from 'react';
import { Chapter, Accent, VoiceGender, AppTheme } from '../types';
import {
  playLiveBrowserSpeech,
  stopLiveBrowserSpeech,
  seekLiveBrowserSpeech,
  setLiveBrowserSpeechVolume,
} from '../utils/browserTTS';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Download,
  Gauge,
  Music,
  Minus,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';

interface AudioPlayerProps {
  currentChapter: Chapter | null;
  bookTitle: string;
  isPlaying: boolean;
  accent?: Accent;
  gender?: VoiceGender;
  onPlayPause: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onDownloadCurrent?: () => void;
  onClose?: () => void;
  theme?: AppTheme;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentChapter,
  bookTitle,
  isPlaying,
  accent = 'american' as Accent,
  gender = 'male' as VoiceGender,
  onPlayPause,
  onPrevChapter,
  onNextChapter,
  hasPrev = false,
  hasNext = false,
  onDownloadCurrent,
  onClose,
  theme = 'light',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isDark = theme === 'dark';
  const isRainbow = theme === 'rainbow';

  // Sync audio source and reset buffers when current chapter changes
  useEffect(() => {
    // 1. Immediately stop any active browser speech
    stopLiveBrowserSpeech();

    // 2. Reset HTML5 audio player
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (currentChapter) {
      setCurrentTime(0);
      const estDuration =
        currentChapter.audioDuration ||
        Math.max(5, Math.round(((currentChapter.wordCount || 100) / 140) * 60));
      setDuration(estDuration);

      if (audioRef.current) {
        if (currentChapter.isClientFallback) {
          // In fallback mode, do not play from audio element (speech synthesis will narrate)
          audioRef.current.removeAttribute('src');
          audioRef.current.load();
        } else if (currentChapter.audioUrl) {
          audioRef.current.src = currentChapter.audioUrl;
          audioRef.current.playbackRate = playbackRate;
          audioRef.current.volume = isMuted ? 0 : volume;
          audioRef.current.load();
        }
      }
    }
  }, [currentChapter?.id, currentChapter?.audioUrl, currentChapter?.isClientFallback]);

  // Sync play/pause state & speech synthesis
  useEffect(() => {
    if (!currentChapter) {
      stopLiveBrowserSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    const effectiveAccent = currentChapter.accentUsed || accent;
    const effectiveGender = currentChapter.genderUsed || gender;

    if (isPlaying) {
      if (currentChapter.isClientFallback) {
        // Stop audio element completely
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        // Use browser speech synthesis only
        stopLiveBrowserSpeech();
        playLiveBrowserSpeech(
          currentChapter.text,
          effectiveAccent,
          effectiveGender,
          playbackRate,
          () => handleEnded(),
          currentChapter.voiceUsed
        );
      } else {
        // Real audio track: stop any browser speech synthesis completely
        stopLiveBrowserSpeech();
        if (audioRef.current && currentChapter.audioUrl) {
          audioRef.current.play().catch((err) => console.warn('Play error:', err));
        }
      }
    } else {
      stopLiveBrowserSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      stopLiveBrowserSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [
    isPlaying,
    currentChapter?.id,
    currentChapter?.audioUrl,
    currentChapter?.isClientFallback,
    currentChapter?.accentUsed,
    currentChapter?.genderUsed,
    playbackRate,
  ]);

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      stopLiveBrowserSpeech();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Timer ticker for speech synthesis fallback
  useEffect(() => {
    let timer: any;
    if (isPlaying && currentChapter?.isClientFallback) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          const maxDur = duration || currentChapter.audioDuration || 60;
          if (prev >= maxDur) {
            handleEnded();
            return maxDur;
          }
          return prev + 1;
        });
      }, 1000 / playbackRate);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentChapter?.isClientFallback, duration, playbackRate]);

  // Sync volume and mute state immediately across both HTML5 Audio and SpeechSynthesis
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    setLiveBrowserSpeechVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Sync speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !currentChapter?.isClientFallback) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !currentChapter?.isClientFallback) {
      setDuration(audioRef.current.duration || currentChapter?.audioDuration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current && !currentChapter?.isClientFallback) {
      audioRef.current.currentTime = newTime;
    } else if (currentChapter?.isClientFallback && isPlaying) {
      const effectiveDuration = duration || currentChapter.audioDuration || 60;
      const ratio = newTime / effectiveDuration;
      const effectiveAccent = currentChapter.accentUsed || accent;
      const effectiveGender = currentChapter.genderUsed || gender;
      seekLiveBrowserSpeech(
        ratio,
        currentChapter.text,
        effectiveAccent,
        effectiveGender,
        playbackRate,
        () => handleEnded(),
        currentChapter.voiceUsed
      );
    }
  };

  const handleSkip = (seconds: number) => {
    const effectiveDuration = duration || currentChapter?.audioDuration || 60;
    const newTime = Math.max(0, Math.min(currentTime + seconds, effectiveDuration));
    setCurrentTime(newTime);
    if (audioRef.current && !currentChapter?.isClientFallback) {
      audioRef.current.currentTime = newTime;
    } else if (currentChapter?.isClientFallback && isPlaying) {
      const ratio = newTime / effectiveDuration;
      const effectiveAccent = currentChapter.accentUsed || accent;
      const effectiveGender = currentChapter.genderUsed || gender;
      seekLiveBrowserSpeech(
        ratio,
        currentChapter.text,
        effectiveAccent,
        effectiveGender,
        playbackRate,
        () => handleEnded(),
        currentChapter.voiceUsed
      );
    }
  };

  const handleEnded = () => {
    stopLiveBrowserSpeech();
    if (hasNext && onNextChapter) {
      onNextChapter();
    } else {
      onPlayPause();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
    setLiveBrowserSpeechVolume(nextMuted ? 0 : volume);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const nextMuted = val === 0;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      audioRef.current.volume = val;
    }
    setLiveBrowserSpeechVolume(nextMuted ? 0 : val);
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentChapter || !currentChapter.audioUrl) {
    return null;
  }

  const effectiveDuration = duration || currentChapter.audioDuration || 1;
  const progressPercent = Math.min(100, (currentTime / effectiveDuration) * 100);

  // Minimized floating player bar
  if (isMinimized) {
    return (
      <div
        className={`fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
          isRainbow
            ? 'border-purple-300 bg-white/95 text-slate-900 shadow-purple-500/20'
            : isDark
            ? 'border-stone-800 bg-stone-900/95 text-stone-100'
            : 'border-stone-700 bg-stone-900/95 text-stone-100'
        }`}
      >
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isRainbow
                ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-2xs'
                : isDark
                ? 'bg-stone-800 text-indigo-400'
                : 'bg-stone-800 text-amber-400'
            }`}
          >
            <Music className="h-4 w-4" />
          </div>
          <div className="max-w-[180px] sm:max-w-[240px]">
            <p className={`truncate text-xs font-semibold ${isRainbow ? 'text-purple-950 font-bold' : 'text-white'}`}>
              {currentChapter.title}
            </p>
            <p className={`text-[10px] ${isRainbow ? 'text-purple-700 font-medium' : 'text-stone-400'}`}>
              Ch. {currentChapter.chapterNumber} • {formatTime(currentTime)} / {formatTime(effectiveDuration)}
            </p>
          </div>
        </div>

        {/* Mini controls */}
        <div className={`flex items-center gap-1 pl-2 border-l ${isRainbow ? 'border-purple-200' : 'border-stone-800'}`}>
          <button
            id="minimized-play-pause-btn"
            type="button"
            onClick={onPlayPause}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              isRainbow
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xs'
                : isDark
                ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                : 'bg-white text-stone-900 hover:bg-stone-200'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Maximize / Restore */}
          <button
            id="player-maximize-btn"
            type="button"
            onClick={() => setIsMinimized(false)}
            className={`p-1.5 rounded-lg transition-colors ${
              isRainbow
                ? 'text-purple-700 hover:text-purple-950 hover:bg-purple-100'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
            title="Expand player"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Cancel / Close */}
          {onClose && (
            <button
              id="minimized-player-close-btn"
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isRainbow
                  ? 'text-purple-600 hover:text-rose-600 hover:bg-rose-50'
                  : 'text-stone-400 hover:text-rose-400 hover:bg-stone-800'
              }`}
              title="Close player"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t shadow-2xl backdrop-blur-lg transition-colors ${
        isRainbow
          ? 'border-purple-200/80 bg-white/95 text-slate-900 shadow-purple-200/50'
          : isDark
          ? 'border-stone-800 bg-stone-950/95 text-stone-100'
          : 'border-stone-800 bg-stone-900 text-stone-100'
      }`}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Scrubber Bar directly on top edge */}
      <div className={`group relative w-full h-1.5 cursor-pointer ${isRainbow ? 'bg-purple-100' : 'bg-stone-800'}`}>
        <div
          className={`h-full transition-all duration-75 ${
            isRainbow
              ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500'
              : isDark
              ? 'bg-indigo-500'
              : 'bg-amber-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
        <input
          type="range"
          min={0}
          max={effectiveDuration}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Seek playback position"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-inner ${
                isRainbow
                  ? 'bg-gradient-to-tr from-pink-400 via-purple-400 to-sky-400 text-white'
                  : isDark
                  ? 'bg-stone-900 text-indigo-400 border border-stone-800'
                  : 'bg-stone-800 text-amber-400'
              }`}
            >
              <Music className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isRainbow ? 'text-pink-600 font-bold' : isDark ? 'text-indigo-400' : 'text-amber-400'
                  }`}
                >
                  Chapter {currentChapter.chapterNumber}
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-0.5">
                    <span
                      className={`h-2 w-0.5 animate-pulse ${
                        isRainbow ? 'bg-pink-500' : isDark ? 'bg-indigo-400' : 'bg-amber-400'
                      }`}
                    />
                    <span
                      className={`h-3.5 w-0.5 animate-pulse delay-75 ${
                        isRainbow ? 'bg-purple-500' : isDark ? 'bg-indigo-400' : 'bg-amber-400'
                      }`}
                    />
                    <span
                      className={`h-2 w-0.5 animate-pulse delay-150 ${
                        isRainbow ? 'bg-sky-500' : isDark ? 'bg-indigo-400' : 'bg-amber-400'
                      }`}
                    />
                  </span>
                )}
              </div>
              <h4 className={`truncate text-sm font-semibold ${isRainbow ? 'text-slate-900' : 'text-white'}`}>
                {currentChapter.title}
              </h4>
              <p className={`truncate text-xs ${isRainbow ? 'text-slate-500' : 'text-stone-400'}`}>{bookTitle}</p>
            </div>
          </div>

          {/* Center: Playback Controls & Time Display */}
          <div className="flex flex-col items-center gap-1 w-full md:w-2/4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Prev Chapter */}
              <button
                id="player-prev-chapter-btn"
                type="button"
                disabled={!hasPrev}
                onClick={onPrevChapter}
                className={`disabled:opacity-30 transition-colors p-1 ${
                  isRainbow ? 'text-purple-700 hover:text-purple-950' : 'text-stone-400 hover:text-white'
                }`}
                title="Previous Chapter"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              {/* Rewind 10s */}
              <button
                id="player-rewind-btn"
                type="button"
                onClick={() => handleSkip(-10)}
                className={`transition-colors p-1 ${
                  isRainbow ? 'text-purple-700 hover:text-purple-950' : 'text-stone-400 hover:text-white'
                }`}
                title="Rewind 10s"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                id="player-play-pause-btn"
                type="button"
                onClick={onPlayPause}
                className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md hover:scale-105 active:scale-95 transition-all ${
                  isRainbow
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-purple-400/30'
                    : isDark
                    ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                    : 'bg-white text-stone-900 hover:bg-stone-200'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Forward 10s */}
              <button
                id="player-forward-btn"
                type="button"
                onClick={() => handleSkip(10)}
                className={`transition-colors p-1 ${
                  isRainbow ? 'text-purple-700 hover:text-purple-950' : 'text-stone-400 hover:text-white'
                }`}
                title="Forward 10s"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              {/* Next Chapter */}
              <button
                id="player-next-chapter-btn"
                type="button"
                disabled={!hasNext}
                onClick={onNextChapter}
                className={`disabled:opacity-30 transition-colors p-1 ${
                  isRainbow ? 'text-purple-700 hover:text-purple-950' : 'text-stone-400 hover:text-white'
                }`}
                title="Next Chapter"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Timestamps */}
            <div
              className={`flex items-center gap-2 text-xs font-medium ${
                isRainbow ? 'text-purple-800' : 'text-stone-400'
              }`}
            >
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(effectiveDuration)}</span>
            </div>
          </div>

          {/* Right: Volume, Speed, Download + Top-Right Minimize & Cancel/Close Controls */}
          <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">
            {/* Speed Selector */}
            <div className="relative">
              <button
                id="player-speed-btn"
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                  isRainbow
                    ? 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                    : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
                }`}
                title="Playback Speed"
              >
                <Gauge className="h-3.5 w-3.5" />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div
                  className={`absolute bottom-full right-0 mb-2 w-24 rounded-xl border p-1 shadow-xl z-50 ${
                    isRainbow
                      ? 'border-purple-200 bg-white text-slate-800'
                      : 'border-stone-700 bg-stone-800'
                  }`}
                >
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full rounded-lg px-2.5 py-1 text-left text-xs font-medium transition-colors ${
                        playbackRate === rate
                          ? isRainbow
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-amber-400 text-stone-950 font-bold'
                          : isRainbow
                          ? 'text-purple-900 hover:bg-purple-50'
                          : 'text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5">
              <button
                id="player-mute-btn"
                type="button"
                onClick={handleToggleMute}
                className={`transition-colors ${
                  isRainbow ? 'text-purple-700 hover:text-purple-950' : 'text-stone-400 hover:text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              <input
                id="player-volume-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={`h-1.5 w-14 sm:w-16 rounded-lg cursor-pointer ${
                  isRainbow
                    ? 'accent-purple-600 bg-purple-200'
                    : isDark
                    ? 'accent-indigo-400 bg-stone-800'
                    : 'accent-amber-400 bg-stone-700'
                }`}
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>

            {/* Download Current Audio */}
            {onDownloadCurrent && (
              <button
                id="player-download-current-btn"
                type="button"
                onClick={onDownloadCurrent}
                className={`transition-colors p-1 ${
                  isRainbow
                    ? 'text-purple-700 hover:text-pink-600'
                    : 'text-stone-400 hover:text-amber-400'
                }`}
                title="Download this chapter audio file"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {/* Divider */}
            <div className={`h-4 w-[1px] mx-0.5 ${isRainbow ? 'bg-purple-200' : 'bg-stone-700'}`} />

            {/* Top-Right Player Window Action Buttons: Minimize and Cancel/Close */}
            <div className="flex items-center gap-1">
              {/* 1. Minimize Player Button */}
              <button
                id="player-minimize-btn"
                type="button"
                onClick={() => setIsMinimized(true)}
                className={`rounded-lg p-1.5 transition-colors ${
                  isRainbow
                    ? 'text-purple-700 hover:bg-purple-100 hover:text-purple-950'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                }`}
                title="Minimize player"
              >
                <Minus className="h-4 w-4" />
              </button>

              {/* 2. Cancel / Close Audio Player Button */}
              {onClose && (
                <button
                  id="player-close-btn"
                  type="button"
                  onClick={onClose}
                  className={`rounded-lg p-1.5 transition-colors ${
                    isRainbow
                      ? 'text-purple-700 hover:bg-rose-50 hover:text-rose-600'
                      : 'text-stone-400 hover:bg-stone-800 hover:text-rose-400'
                  }`}
                  title="Cancel and close audio player"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

