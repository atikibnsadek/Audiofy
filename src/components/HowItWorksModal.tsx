import React from 'react';
import { X, FileUp, Sliders, Volume2, Download, Sparkles } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3 className="text-base font-bold text-stone-900">How to use AudioBookify</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-stone-600">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-800 font-bold text-xs">
              1
            </div>
            <div>
              <p className="font-semibold text-stone-900">Upload PDF or Pick a Sample</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Drop your PDF file on the left side, or select one of the instant classic books to test immediately.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-800 font-bold text-xs">
              2
            </div>
            <div>
              <p className="font-semibold text-stone-900">Choose Accent and Voice</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Select American 🇺🇸 or British 🇬🇧 accent, and Male or Female voice tone before generating.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-800 font-bold text-xs">
              3
            </div>
            <div>
              <p className="font-semibold text-stone-900">Chapter-by-Chapter Audio Generation</p>
              <p className="text-xs text-stone-500 mt-0.5">
                The book is split into distinct chapters. Click "Generate All" or generate individual chapters.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-800 font-bold text-xs">
              4
            </div>
            <div>
              <p className="font-semibold text-stone-900">Listen & Download</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Play using the built-in player (volume, speed, scrubber), or download chapter audio files (.wav) or a full ZIP bundle!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
          >
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  );
};
