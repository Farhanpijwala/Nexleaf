/**
 * Client-side PDF text extraction utility using PDF.js
 */
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export async function extractTextFromPdf(file: File): Promise<string> {
  // If it's a plain text file, read directly
  if (file.type === 'text/plain') {
    return await file.text();
  }

  const pdfjsLib = await import('pdfjs-dist');

  // Use the worker bundled by Vite (see the ?url import above) instead of a
  // CDN copy, so extraction also works offline and with a pinned version.
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  const numPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= Math.min(numPages, 10); pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += `\n--- Page ${pageNum} ---\n` + pageText;
  }

  if (fullText.trim().length > 20) {
    return fullText.trim();
  }

  // Fail honestly: never substitute invented resume content for a file
  // whose text could not actually be read.
  throw new Error(
    'No readable text could be extracted from this file. Please upload a text-based PDF or a .txt file.'
  );
}
