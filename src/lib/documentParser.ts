import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

// Configure PDF.js worker using unpkg CDN fallback
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.0'}/build/pdf.worker.min.mjs`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function parseDocument(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // Plain text / Markdown / CSV
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
    return await file.text();
  }

  // Word Document (.docx)
  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.value && result.value.trim()) {
      return result.value.trim();
    }
    throw new Error('No readable text found in this Word document.');
  }

  // PDF Document (.pdf)
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    
    let extractedText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageItems = textContent.items
        .map((item: any) => item.str || '')
        .filter(Boolean);
      
      const pageStr = pageItems.join(' ');
      if (pageStr.trim()) {
        extractedText += (extractedText ? '\n\n' : '') + pageStr;
      }
    }

    if (extractedText.trim()) {
      return extractedText.trim();
    }
    throw new Error('This PDF appears to be scanned or contains no extractable text.');
  }

  // Fallback text read
  try {
    const text = await file.text();
    if (text && text.trim()) return text.trim();
  } catch {
    // Ignore fallback failure
  }

  throw new Error('Unsupported file format. Please upload a Word (.docx), PDF (.pdf), or Text (.txt) file.');
}

export function downloadConstitutionAsWord(groupName: string, constitutionText: string) {
  const paragraphs = constitutionText
    .split(/\n+/)
    .map(p => `<p style="margin-bottom: 12pt; line-height: 1.6; font-size: 11pt; font-family: 'Calibri', 'Arial', sans-serif;">${escapeHtml(p)}</p>`)
    .join('');

  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHtml(groupName)} - Constitution</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4;
          margin: 1in;
        }
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          color: #1a202c;
          padding: 20px;
        }
        h1 {
          font-size: 20pt;
          color: #0f172a;
          border-bottom: 2pt solid #2563eb;
          padding-bottom: 6pt;
          margin-bottom: 6pt;
          text-align: center;
          font-family: 'Calibri', 'Arial', sans-serif;
        }
        .subtitle {
          text-align: center;
          font-size: 12pt;
          color: #2563eb;
          font-weight: bold;
          margin-bottom: 6pt;
          letter-spacing: 1pt;
        }
        .meta {
          text-align: center;
          font-size: 9pt;
          color: #64748b;
          margin-bottom: 24pt;
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(groupName)}</h1>
      <div class="subtitle">GROUP CONSTITUTION & BYLAWS</div>
      <div class="meta">Exported on ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</div>
      <div>
        ${paragraphs}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${groupName.replace(/[^a-z0-9]/gi, '_')}_Constitution.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadConstitutionAsPdf(groupName: string, constitutionText: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(groupName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('GROUP CONSTITUTION & BYLAWS', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Horizontal divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 9;

  // Body content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const paragraphs = constitutionText.split('\n');
  for (const para of paragraphs) {
    if (!para.trim()) {
      y += 3.5;
      continue;
    }

    const lines = doc.splitTextToSize(para, contentWidth);
    for (const line of lines) {
      if (y + 7 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5.2;
    }
    y += 2.5; // space after paragraph
  }

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  doc.save(`${groupName.replace(/[^a-z0-9]/gi, '_')}_Constitution.pdf`);
}
