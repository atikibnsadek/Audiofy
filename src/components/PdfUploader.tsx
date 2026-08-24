import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Book } from 'lucide-react';
import { SAMPLE_BOOKS, SampleBook } from '../data/sampleBooks';
import { AppTheme } from '../types';

interface PdfUploaderProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: (sample: SampleBook) => void;
  selectedFileName?: string;
  isProcessing?: boolean;
  selectedSampleId?: string;
  theme?: AppTheme;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onFileSelect,
  onSampleSelect,
  selectedFileName,
  isProcessing = false,
  selectedSampleId,
  theme = 'light',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const isRainbow = theme === 'rainbow';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.type.startsWith('text/')) {
        onFileSelect(file);
      } else {
        setDragError('Please upload a PDF document (.pdf) or text file.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDragError(null);
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors duration-300 ${
        isDark
          ? 'border-stone-800 bg-stone-900 shadow-md text-stone-100'
          : isRainbow
          ? 'border-sky-200/80 bg-white/90 shadow-md shadow-sky-100/50 text-slate-800'
          : 'border-stone-200 bg-white p-5 shadow-xs text-stone-900'
      }`}
    >
      <div className="mb-4">
        <h3
          className={`text-base font-semibold ${
            isDark
              ? 'text-stone-100'
              : isRainbow
              ? 'bg-gradient-to-r from-sky-700 to-indigo-700 bg-clip-text text-transparent font-bold'
              : 'text-stone-900'
          }`}
        >
          Upload PDF
        </h3>
        <p className={`text-xs ${isDark ? 'text-stone-400' : isRainbow ? 'text-slate-600' : 'text-stone-500'}`}>
          Upload any book or document to split into chapters and convert to audio
        </p>
      </div>

      {/* Quick Sample Books Section (Moved to Top) */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span
            className={`flex items-center gap-1.5 text-xs font-medium ${
              isDark ? 'text-stone-400' : isRainbow ? 'text-purple-800 font-semibold' : 'text-stone-600'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${isRainbow ? 'text-pink-500' : 'text-amber-500'}`} />
            <span>Or try an instant sample book</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_BOOKS.map((book) => {
            const isSelected = selectedSampleId === book.id;
            return (
              <button
                key={book.id}
                id={`sample-book-${book.id}`}
                type="button"
                disabled={isProcessing}
                onClick={() => onSampleSelect(book)}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                  isSelected
                    ? isDark
                      ? 'border-indigo-500/80 bg-indigo-950/40 text-stone-100 ring-1 ring-indigo-500/40 shadow-xs'
                      : isRainbow
                      ? 'border-purple-300 bg-gradient-to-r from-pink-50 to-purple-50 text-purple-950 ring-1 ring-purple-300 shadow-xs'
                      : 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : isDark
                    ? 'border-stone-800 bg-stone-950/50 text-stone-300 hover:bg-stone-800/80 hover:border-stone-700'
                    : isRainbow
                    ? 'border-sky-200/70 bg-white text-slate-800 hover:bg-sky-50/50 hover:border-sky-300'
                    : 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <Book
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isSelected
                        ? isDark
                          ? 'text-indigo-400'
                          : isRainbow
                          ? 'text-pink-500'
                          : 'text-stone-300'
                        : isDark
                        ? 'text-stone-500'
                        : isRainbow
                        ? 'text-purple-400'
                        : 'text-stone-500'
                    }`}
                  />
                  <span className="text-xs font-semibold truncate w-full">{book.title}</span>
                </div>
                <span
                  className={`text-[11px] mt-1 truncate w-full ${
                    isSelected
                      ? isDark
                        ? 'text-indigo-200'
                        : isRainbow
                        ? 'text-purple-800'
                        : 'text-stone-300'
                      : isDark
                      ? 'text-stone-400'
                      : isRainbow
                      ? 'text-slate-500'
                      : 'text-stone-500'
                  }`}
                >
                  {book.chapters.length} chapters • {book.author}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drop Zone (Moved Below Sample Books) */}
      <div
        className={`pt-4 border-t ${
          isDark ? 'border-stone-800' : isRainbow ? 'border-sky-100' : 'border-stone-100'
        }`}
      >
        <div
          id="pdf-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            isDragOver
              ? isDark
                ? 'border-indigo-500 bg-stone-800/80 scale-[1.01]'
                : isRainbow
                ? 'border-pink-400 bg-pink-50/60 scale-[1.01]'
                : 'border-stone-900 bg-stone-100/70 scale-[1.01]'
              : selectedFileName
              ? isDark
                ? 'border-emerald-700 bg-emerald-950/20'
                : isRainbow
                ? 'border-emerald-400 bg-emerald-50/60 shadow-xs'
                : 'border-emerald-500 bg-emerald-50/40'
              : isDark
              ? 'border-stone-700 bg-stone-950/50 hover:border-stone-600 hover:bg-stone-800/60'
              : isRainbow
              ? 'border-sky-200/90 bg-sky-50/50 hover:border-sky-300 hover:bg-sky-50/80'
              : 'border-stone-300 bg-stone-50/60 hover:border-stone-400 hover:bg-stone-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf,text/plain"
            onChange={handleInputChange}
            className="hidden"
            id="pdf-file-input"
          />

          {selectedFileName ? (
            <div className="flex flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isDark
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                    : isRainbow
                    ? 'bg-gradient-to-tr from-emerald-400 to-teal-400 text-white shadow-xs'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p
                className={`mt-2 text-sm font-semibold max-w-[240px] truncate ${
                  isDark ? 'text-stone-100' : isRainbow ? 'text-slate-900' : 'text-stone-900'
                }`}
              >
                {selectedFileName}
              </p>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  isDark ? 'text-emerald-400' : isRainbow ? 'text-emerald-700 font-semibold' : 'text-emerald-700'
                }`}
              >
                Document loaded • Click to replace
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? 'bg-stone-800 text-stone-300 border border-stone-700'
                    : isRainbow
                    ? 'bg-gradient-to-tr from-sky-400 to-indigo-400 text-white shadow-xs'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                <UploadCloud className="h-6 w-6" />
              </div>
              <p
                className={`mt-3 text-sm font-medium ${
                  isDark ? 'text-stone-200' : isRainbow ? 'text-slate-800' : 'text-stone-900'
                }`}
              >
                Drop your PDF here, or{' '}
                <span
                  className={`underline font-semibold ${
                    isDark ? 'text-indigo-400' : isRainbow ? 'text-sky-600' : 'text-stone-900'
                  }`}
                >
                  browse
                </span>
              </p>
              <p className={`mt-1 text-xs ${isDark ? 'text-stone-400' : isRainbow ? 'text-slate-500' : 'text-stone-500'}`}>
                Supports standard PDFs, books, manuscripts (.pdf)
              </p>
            </div>
          )}
        </div>
      </div>

      {dragError && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{dragError}</span>
        </div>
      )}
    </div>
  );
};

