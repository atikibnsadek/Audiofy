import React from 'react';
import { Chapter } from '../types';
import { X, BookOpen, Volume2, Copy, Check } from 'lucide-react';

interface ChapterReaderModalProps {
  chapter: Chapter | null;
  bookTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onPlayAudio?: () => void;
}

export const ChapterReaderModal: React.FC<ChapterReaderModalProps> = ({
  chapter,
  bookTitle,
  isOpen,
  onClose,
  onPlayAudio,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !chapter) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(chapter.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Chapter {chapter.chapterNumber} • {bookTitle}
              </span>
              <h3 className="text-base font-bold text-stone-900">{chapter.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              title="Copy text"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              id="close-reader-modal-btn"
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary pill if available */}
        {chapter.summary && (
          <div className="bg-amber-50/70 border-b border-amber-100/60 px-6 py-2.5 text-xs text-amber-900 font-medium">
            <span className="font-bold">Summary: </span>
            {chapter.summary}
          </div>
        )}

        {/* Text Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 font-serif text-stone-800 leading-relaxed text-sm sm:text-base selection:bg-amber-200">
          {chapter.text.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-justify">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-stone-100 px-6 py-3 bg-stone-50 rounded-b-2xl">
          <span className="text-xs text-stone-500">
            {chapter.wordCount} words • ~{chapter.estimatedMinutes} min read
          </span>

          {chapter.audioUrl && onPlayAudio && (
            <button
              type="button"
              onClick={() => {
                onPlayAudio();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition-all shadow-xs"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Listen to Chapter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
