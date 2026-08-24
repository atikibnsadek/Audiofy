import React, { useState } from 'react';
import { Accent, VoiceGender, AppTheme } from '../types';
import { VOICE_OPTIONS } from '../data/sampleBooks';
import { Volume2, Loader2, CheckCircle2, User, Globe2, Sparkles, Mic } from 'lucide-react';
import { playLiveBrowserSpeech, stopLiveBrowserSpeech } from '../utils/browserTTS';

interface VoiceSelectorProps {
  accent: Accent;
  gender: VoiceGender;
  selectedVoiceId: string;
  onAccentChange: (accent: Accent) => void;
  onGenderChange: (gender: VoiceGender) => void;
  onVoiceChange: (voiceId: string) => void;
  disabled?: boolean;
  theme?: AppTheme;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  accent,
  gender,
  selectedVoiceId,
  onAccentChange,
  onGenderChange,
  onVoiceChange,
  disabled = false,
  theme = 'light',
}) => {
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const isRainbow = theme === 'rainbow';

  // Filter voices matching selected accent and gender
  const availableVoices = VOICE_OPTIONS.filter(
    (v) => v.accent === accent && v.gender === gender
  );

  // Guarantee active voice is matched
  const activeVoice =
    availableVoices.find((v) => v.id === selectedVoiceId) ||
    availableVoices[0] ||
    VOICE_OPTIONS[0];

  const handleTestVoice = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    stopLiveBrowserSpeech();

    const voice = VOICE_OPTIONS.find((v) => v.id === voiceId) || activeVoice;
    if (!voice) return;

    if (testingVoiceId === voice.id) {
      setTestingVoiceId(null);
      return;
    }

    setTestingVoiceId(voice.id);

    // Speak sample text with natural timbre and distinct persona profile
    playLiveBrowserSpeech(
      voice.sampleText,
      voice.accent,
      voice.gender,
      1.0,
      () => setTestingVoiceId(null),
      voice.id
    );
  };

  const handleAccentSelect = (newAccent: Accent) => {
    onAccentChange(newAccent);
    const matched = VOICE_OPTIONS.find((v) => v.accent === newAccent && v.gender === gender);
    if (matched) {
      onVoiceChange(matched.id);
    }
  };

  const handleGenderSelect = (newGender: VoiceGender) => {
    onGenderChange(newGender);
    const matched = VOICE_OPTIONS.find((v) => v.accent === accent && v.gender === newGender);
    if (matched) {
      onVoiceChange(matched.id);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors duration-300 ${
        isDark
          ? 'border-stone-800 bg-stone-900 shadow-md text-stone-100'
          : isRainbow
          ? 'border-purple-200/80 bg-white/90 shadow-md shadow-purple-100/50 text-slate-800'
          : 'border-stone-200 bg-white shadow-xs text-stone-900'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3
            className={`text-base font-semibold ${
              isDark
                ? 'text-stone-100'
                : isRainbow
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent font-bold'
                : 'text-stone-900'
            }`}
          >
            Audiobook Voice
          </h3>
          <p className={`text-xs ${isDark ? 'text-stone-400' : isRainbow ? 'text-slate-600' : 'text-stone-500'}`}>
            Select accent, gender, and natural narrator profile
          </p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
            isDark
              ? 'bg-amber-950/60 border-amber-800/60 text-amber-300'
              : isRainbow
              ? 'bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 text-purple-900 border-purple-200/60 font-semibold shadow-2xs'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <Sparkles className={`h-3 w-3 ${isRainbow ? 'text-pink-500' : 'text-amber-500'}`} />
          <span>Natural AI Voice</span>
        </div>
      </div>

      {/* Row 1: Accent Choice */}
      <div className="mb-4">
        <label
          className={`mb-2 flex items-center gap-1.5 text-xs font-medium ${
            isDark ? 'text-stone-300' : isRainbow ? 'text-purple-900 font-semibold' : 'text-stone-700'
          }`}
        >
          <Globe2 className={`h-3.5 w-3.5 ${isDark ? 'text-stone-400' : isRainbow ? 'text-purple-500' : 'text-stone-500'}`} />
          <span>Accent</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="accent-american-btn"
            type="button"
            disabled={disabled}
            onClick={() => handleAccentSelect('american')}
            className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-sm font-medium transition-all ${
              accent === 'american'
                ? isDark
                  ? 'border-indigo-500 bg-indigo-950/50 text-indigo-200 ring-1 ring-indigo-500/50 shadow-xs'
                  : isRainbow
                  ? 'border-purple-400 bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-xs'
                  : 'border-stone-900 bg-stone-900 text-white shadow-xs'
                : isDark
                ? 'border-stone-800 bg-stone-950/50 text-stone-300 hover:bg-stone-800/80 hover:border-stone-700'
                : isRainbow
                ? 'border-purple-200/70 bg-purple-50/40 text-slate-800 hover:bg-purple-50 hover:border-purple-300'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="text-base">🇺🇸</span>
            <span>American</span>
          </button>
          <button
            id="accent-british-btn"
            type="button"
            disabled={disabled}
            onClick={() => handleAccentSelect('british')}
            className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-sm font-medium transition-all ${
              accent === 'british'
                ? isDark
                  ? 'border-indigo-500 bg-indigo-950/50 text-indigo-200 ring-1 ring-indigo-500/50 shadow-xs'
                  : isRainbow
                  ? 'border-purple-400 bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-xs'
                  : 'border-stone-900 bg-stone-900 text-white shadow-xs'
                : isDark
                ? 'border-stone-800 bg-stone-950/50 text-stone-300 hover:bg-stone-800/80 hover:border-stone-700'
                : isRainbow
                ? 'border-purple-200/70 bg-purple-50/40 text-slate-800 hover:bg-purple-50 hover:border-purple-300'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="text-base">🇬🇧</span>
            <span>British</span>
          </button>
        </div>
      </div>

      {/* Row 2: Voice Gender Choice */}
      <div className="mb-4">
        <label
          className={`mb-2 flex items-center gap-1.5 text-xs font-medium ${
            isDark ? 'text-stone-300' : isRainbow ? 'text-purple-900 font-semibold' : 'text-stone-700'
          }`}
        >
          <User className={`h-3.5 w-3.5 ${isDark ? 'text-stone-400' : isRainbow ? 'text-pink-500' : 'text-stone-500'}`} />
          <span>Narrator Gender</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="gender-male-btn"
            type="button"
            disabled={disabled}
            onClick={() => handleGenderSelect('male')}
            className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-sm font-medium transition-all ${
              gender === 'male'
                ? isDark
                  ? 'border-indigo-500 bg-indigo-950/50 text-indigo-200 ring-1 ring-indigo-500/50 shadow-xs'
                  : isRainbow
                  ? 'border-pink-400 bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xs'
                  : 'border-stone-900 bg-stone-900 text-white shadow-xs'
                : isDark
                ? 'border-stone-800 bg-stone-950/50 text-stone-300 hover:bg-stone-800/80 hover:border-stone-700'
                : isRainbow
                ? 'border-pink-200/70 bg-pink-50/40 text-slate-800 hover:bg-pink-50 hover:border-pink-300'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="font-semibold text-xs">♂</span>
            <span>Male</span>
          </button>
          <button
            id="gender-female-btn"
            type="button"
            disabled={disabled}
            onClick={() => handleGenderSelect('female')}
            className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-sm font-medium transition-all ${
              gender === 'female'
                ? isDark
                  ? 'border-indigo-500 bg-indigo-950/50 text-indigo-200 ring-1 ring-indigo-500/50 shadow-xs'
                  : isRainbow
                  ? 'border-pink-400 bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xs'
                  : 'border-stone-900 bg-stone-900 text-white shadow-xs'
                : isDark
                ? 'border-stone-800 bg-stone-950/50 text-stone-300 hover:bg-stone-800/80 hover:border-stone-700'
                : isRainbow
                ? 'border-pink-200/70 bg-pink-50/40 text-slate-800 hover:bg-pink-50 hover:border-pink-300'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="font-semibold text-xs">♀</span>
            <span>Female</span>
          </button>
        </div>
      </div>

      {/* Row 3: Narrator Persona / Tone Selection */}
      <div>
        <label
          className={`mb-2 flex items-center justify-between text-xs font-medium ${
            isDark ? 'text-stone-300' : isRainbow ? 'text-purple-900 font-semibold' : 'text-stone-700'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Mic className={`h-3.5 w-3.5 ${isDark ? 'text-stone-400' : isRainbow ? 'text-purple-500' : 'text-stone-500'}`} />
            <span>Narrator Voice Style</span>
          </span>
          <span className={`text-[11px] font-normal ${isDark ? 'text-stone-400' : isRainbow ? 'text-purple-700' : 'text-stone-400'}`}>
            {availableVoices.length} natural profiles
          </span>
        </label>

        <div className="space-y-2">
          {availableVoices.map((voice) => {
            const isSelected = activeVoice.id === voice.id;
            const isTesting = testingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                id={`voice-option-${voice.id}`}
                onClick={() => !disabled && onVoiceChange(voice.id)}
                className={`relative flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected
                    ? isDark
                      ? 'border-indigo-500/80 bg-indigo-950/40 text-stone-100 ring-1 ring-indigo-500/40 shadow-xs'
                      : isRainbow
                      ? 'border-pink-300 bg-gradient-to-r from-pink-50/80 to-purple-50/80 text-purple-950 ring-1 ring-pink-300 shadow-xs'
                      : 'border-stone-900 bg-stone-900/5 ring-1 ring-stone-900/10'
                    : isDark
                    ? 'border-stone-800 bg-stone-950/50 hover:bg-stone-800/70 hover:border-stone-700'
                    : isRainbow
                    ? 'border-purple-100 bg-white/80 hover:bg-purple-50/60 hover:border-purple-200'
                    : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100/80 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-2.5 pr-2">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isSelected
                        ? isDark
                          ? 'bg-indigo-600 text-white'
                          : isRainbow
                          ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-2xs'
                          : 'bg-stone-900 text-white'
                        : isDark
                        ? 'bg-stone-800 text-stone-400'
                        : isRainbow
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      gender === 'male' ? 'M' : 'F'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isDark ? 'text-stone-100' : isRainbow ? 'text-purple-950 font-bold' : 'text-stone-900'
                        }`}
                      >
                        {voice.name}
                      </span>
                      {isSelected && (
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${
                            isDark
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                              : isRainbow
                              ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200/60 font-semibold'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] leading-snug mt-0.5 ${
                        isDark ? 'text-stone-400' : isRainbow ? 'text-slate-600' : 'text-stone-500'
                      }`}
                    >
                      {voice.description}
                    </p>
                  </div>
                </div>

                <button
                  id={`test-voice-${voice.id}`}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => handleTestVoice(voice.id, e)}
                  title="Listen to a live audio sample of this voice"
                  className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    isTesting
                      ? isDark
                        ? 'border-amber-500 bg-amber-950/60 text-amber-300'
                        : isRainbow
                        ? 'border-pink-400 bg-pink-100 text-pink-900'
                        : 'border-amber-400 bg-amber-50 text-amber-900'
                      : isSelected
                      ? isDark
                        ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700'
                        : isRainbow
                        ? 'border-purple-200 bg-white text-purple-900 hover:bg-purple-50 shadow-2xs'
                        : 'border-stone-300 bg-white text-stone-800 shadow-2xs hover:bg-stone-100'
                      : isDark
                      ? 'border-stone-700 bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                      : isRainbow
                      ? 'border-purple-100 bg-white text-purple-800 hover:bg-purple-50'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                      <span className="hidden sm:inline">Playing</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className={`h-3 w-3 ${isDark ? 'text-stone-400' : isRainbow ? 'text-pink-500' : 'text-stone-600'}`} />
                      <span>Sample</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


