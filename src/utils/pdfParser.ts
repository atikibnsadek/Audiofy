/**
 * Utilities for extracting text and base64 from PDF files in browser
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available or fallback
try {
  // Use unpkg worker or bundled worker if available
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch {
  // Worker initialization fallback
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    let fullText = '';
    for (let pageNum = 1; pageNum <= Math.min(pageCount, 100); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageItems = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');

      fullText += `\n\n--- Page ${pageNum} ---\n` + pageItems;
    }

    return { text: fullText.trim(), pageCount };
  } catch (err) {
    console.warn('Direct PDF text extraction failed, falling back to base64 upload:', err);
    return { text: '', pageCount: 1 };
  }
}
