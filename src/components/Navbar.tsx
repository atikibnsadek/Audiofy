import React from 'react';
import { BookOpen, Sparkles, Volume2, HelpCircle, Sun, Moon } from 'lucide-react';
import { AppTheme } from '../types';

export const RainbowIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth="2.3" strokeLinecap="round">
    <path d="M4 18a8 8 0 0 1 16 0" stroke="url(#rb1)" />
    <path d="M7 18a5 5 0 0 1 10 0" stroke="url(#rb2)" />
    <path d="M10 18a2 2 0 0 1 4 0" stroke="url(#rb3)" />
    <defs>
      <linearGradient id="rb1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <linearGradient id="rb2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="50%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>
      <linearGradient id="rb3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

interface NavbarProps {
  theme: AppTheme;
  onToggleTheme: () => void;
  onOpenHelp?: () => void;
  onOpenAudioDownloads?: () => void;
  bookTitle?: string;
  totalChapters?: number;
  readyAudioCount?: number;
  storedAudioCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenHelp,
  onOpenAudioDownloads,
  bookTitle,
  totalChapters = 0,
  readyAudioCount = 0,
  storedAudioCount = 0,
}) => {
  const isDark = theme === 'dark';
  const isRainbow = theme === 'rainbow';

  return (
    <header
      className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-300 ${
        isDark
          ? 'border-stone-800 bg-stone-950/90 text-stone-100'
          : isRainbow
          ? 'border-pink-200/70 bg-white/80 text-stone-900 shadow-xs shadow-pink-100/50'
          : 'border-stone-200 bg-stone-50/90 text-stone-900'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all duration-300 ${
              isDark
                ? 'bg-stone-800 text-stone-100 border border-stone-700'
                : isRainbow
                ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-sky-400 text-white shadow-md shadow-pink-200/50'
                : 'bg-stone-900 text-stone-100'
            }`}
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg font-semibold tracking-tight ${
                  isDark
                    ? 'text-stone-100'
                    : isRainbow
                    ? 'bg-gradient-to-r from-purple-700 via-pink-600 to-sky-600 bg-clip-text text-transparent font-bold'
                    : 'text-stone-900'
                }`}
              >
                AudioBookify
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isDark
                    ? 'bg-amber-950/60 border border-amber-800/60 text-amber-300'
                    : isRainbow
                    ? 'bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 text-purple-900 border border-purple-200/60 font-semibold'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                AI Voice
              </span>
            </div>
            <p
              className={`text-xs hidden sm:block ${
                isDark ? 'text-stone-400' : isRainbow ? 'text-purple-900/70 font-medium' : 'text-stone-500'
              }`}
            >
              Convert PDF books into chapter audio files
            </p>
          </div>
        </div>

        {/* Center / Status */}
        {bookTitle && totalChapters > 0 && (
          <div
            className={`hidden md:flex items-center gap-3 rounded-full border px-4 py-1.5 shadow-xs transition-colors duration-300 ${
              isDark
                ? 'border-stone-800 bg-stone-900 text-stone-200'
                : isRainbow
                ? 'border-pink-200/80 bg-white/90 shadow-pink-100/40 text-stone-800'
                : 'border-stone-200 bg-white text-stone-700'
            }`}
          >
            <Volume2
              className={`h-4 w-4 ${
                isDark ? 'text-stone-400' : isRainbow ? 'text-pink-500' : 'text-stone-500'
              }`}
            />
            <span
              className={`max-w-[200px] truncate text-xs font-medium ${
                isDark ? 'text-stone-200' : isRainbow ? 'text-purple-950 font-semibold' : 'text-stone-700'
              }`}
            >
              {bookTitle}
            </span>
            <span className={isDark ? 'text-stone-600' : 'text-stone-400'}>•</span>
            <span
              className={`text-xs font-semibold ${
                isDark
                  ? 'text-emerald-400'
                  : isRainbow
                  ? 'text-emerald-700 font-bold'
                  : 'text-emerald-700'
              }`}
            >
              {readyAudioCount}/{totalChapters} audio ready
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Switcher Circular Button - directly beside (on the left of) 'how it works' button */}
          <button
            id="theme-mode-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-2 ${
              isDark
                ? 'border-stone-700 bg-stone-900 text-indigo-300 shadow-md shadow-stone-950 hover:bg-stone-800 hover:border-indigo-500/50 hover:text-indigo-200 focus:ring-indigo-500/40'
                : isRainbow
                ? 'border-pink-300/80 bg-gradient-to-tr from-pink-100 via-purple-100 to-sky-100 text-purple-700 shadow-sm shadow-pink-200/50 hover:from-pink-200 hover:via-purple-200 hover:to-sky-200 hover:border-pink-400 focus:ring-pink-400/40'
                : 'border-amber-200/90 bg-amber-50 text-amber-600 shadow-xs hover:bg-amber-100/80 hover:border-amber-300 hover:text-amber-700 focus:ring-amber-400/40'
            }`}
            title={
              theme === 'light'
                ? 'Mode: Normal (Light) ☀️ • Click to switch to Dark Mode 🌙'
                : theme === 'dark'
                ? 'Mode: Dark 🌙 • Click to switch to Rainbow Mode 🌈'
                : 'Mode: Rainbow 🌈 • Click to switch to Normal Mode ☀️'
            }
            aria-label="Toggle theme mode (Normal, Dark, Rainbow)"
          >
            {theme === 'light' && (
              <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200 group-hover:rotate-45" />
            )}
            {theme === 'dark' && (
              <Moon className="h-4 w-4 text-indigo-300 transition-transform duration-200 group-hover:-rotate-12" />
            )}
            {theme === 'rainbow' && (
              <RainbowIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            )}
          </button>

          {/* How It Works Button */}
          {onOpenHelp && (
            <button
              id="help-guide-btn"
              onClick={onOpenHelp}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-xs transition-colors ${
                isDark
                  ? 'border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-stone-100 hover:border-stone-600'
                  : isRainbow
                  ? 'border-pink-200 bg-white/95 text-stone-800 hover:bg-pink-50/70 hover:text-purple-900 hover:border-pink-300 shadow-pink-100/30'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <HelpCircle
                className={`h-3.5 w-3.5 ${
                  isDark ? 'text-stone-400' : isRainbow ? 'text-pink-500' : 'text-stone-500'
                }`}
              />
              <span className="hidden sm:inline">How it works</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


