import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { withBasePath } from '../lib/basePath';

const PAGE_WIDTH = 595.28; // A4 @ 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

// 需支援中文字元，pdf-lib 內建 StandardFonts 無中文字型，
// 需自行放置 CJK 字型檔於 /public/fonts/NotoSansTC-Regular.ttf
// （可從 Google Fonts 下載 Noto Sans TC，檔案較大不內建於 repo）
async function embedChineseFont(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);
  try {
    const res = await fetch(withBasePath('/fonts/NotoSansTC-Regular.ttf'));
    if (!res.ok) throw new Error('font not found');
    const fontBytes = await res.arrayBuffer();
    return await pdfDoc.embedFont(fontBytes);
  } catch (err) {
    console.warn('找不到中文字型檔 /public/fonts/NotoSansTC-Regular.ttf，中文將無法正確顯示', err);
    return null;
  }
}

function wrapText(text, font, size, maxWidth) {
  const lines = [];
  for (const paragraph of String(text || '').split('\n')) {
    let current = '';
    for (const ch of paragraph) {
      const test = current + ch;
      if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    lines.push(current);
  }
  return lines;
}

function drawParagraph(page, font, text, x, y, size, maxWidth, lineHeight) {
  const lines = wrapText(text, font, size, maxWidth);
  let cursorY = y;
  for (const line of lines) {
    if (cursorY < MARGIN) break;
    page.drawText(line, { x, y: cursorY, size, font, color: rgb(0.1, 0.1, 0.1) });
    cursorY -= lineHeight;
  }
  return cursorY;
}

function addTextPage(pdfDoc, font, boldFont) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { page, y: PAGE_HEIGHT - MARGIN, maxWidth: PAGE_WIDTH - MARGIN * 2 };
}

async function buildCoverPage(pdfDoc, font, boldFont, profile) {
  const { page } = addTextPage(pdfDoc, font, boldFont);
  let y = PAGE_HEIGHT - MARGIN;
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  page.drawText(profile.name || '', { x: MARGIN, y, size: 24, font: boldFont || font });
  y -= 40;

  if (profile.photo && profile.photo.startsWith('data:image')) {
    try {
      const isPng = profile.photo.includes('image/png');
      const image = isPng
        ? await pdfDoc.embedPng(profile.photo)
        : await pdfDoc.embedJpg(profile.photo);
      const imgWidth = 120;
      const imgHeight = (image.height / image.width) * imgWidth;
      page.drawImage(image, { x: MARGIN, y: y - imgHeight, width: imgWidth, height: imgHeight });
      y -= imgHeight + 20;
    } catch (err) {
      console.warn('個人照片嵌入失敗', err);
    }
  }

  page.drawText('學歷', { x: MARGIN, y, size: 14, font: boldFont || font });
  y -= 20;
  for (const edu of profile.education || []) {
    y = drawParagraph(
      page,
      font,
      `${edu.school || ''} ${edu.degree || ''} ${edu.year || ''}`,
      MARGIN,
      y,
      11,
      maxWidth,
      16
    );
  }

  y -= 10;
  page.drawText('經歷', { x: MARGIN, y, size: 14, font: boldFont || font });
  y -= 20;
  for (const exp of profile.experience || []) {
    y = drawParagraph(
      page,
      font,
      `${exp.company || ''} ${exp.title || ''} ${exp.period || ''} ${exp.desc || ''}`,
      MARGIN,
      y,
      11,
      maxWidth,
      16
    );
  }

  y -= 10;
  page.drawText('自我介紹', { x: MARGIN, y, size: 14, font: boldFont || font });
  y -= 20;
  drawParagraph(page, font, profile.bio || '', MARGIN, y, 11, maxWidth, 16);
}

function buildCoursePage(pdfDoc, font, boldFont, course) {
  const { page } = addTextPage(pdfDoc, font, boldFont);
  let y = PAGE_HEIGHT - MARGIN;
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  page.drawText(`${course.week || ''} ${course.courseTitle || ''}`, {
    x: MARGIN,
    y,
    size: 18,
    font: boldFont || font,
  });
  y -= 30;

  if (course.instructor?.name) {
    page.drawText(`授課教師：${course.instructor.name}`, { x: MARGIN, y, size: 12, font });
    y -= 24;
  }

  const sections = [
    ['課程內容', course.content],
    ['個案討論', course.caseDiscussion],
    ['分組報告', course.groupProject],
  ];

  for (const [label, text] of sections) {
    if (!text) continue;
    page.drawText(label, { x: MARGIN, y, size: 13, font: boldFont || font });
    y -= 18;
    y = drawParagraph(page, font, text, MARGIN, y, 11, maxWidth, 16);
    y -= 10;
  }
}

async function appendPdfBytes(pdfDoc, bytes) {
  const donor = await PDFDocument.load(bytes);
  const pages = await pdfDoc.copyPages(donor, donor.getPageIndices());
  pages.forEach((p) => pdfDoc.addPage(p));
}

async function appendImagePage(pdfDoc, dataUrlOrBytes, isPng) {
  const image = isPng ? await pdfDoc.embedPng(dataUrlOrBytes) : await pdfDoc.embedJpg(dataUrlOrBytes);
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const scale = Math.min(
    (PAGE_WIDTH - MARGIN * 2) / image.width,
    (PAGE_HEIGHT - MARGIN * 2) / image.height
  );
  const w = image.width * scale;
  const h = image.height * scale;
  page.drawImage(image, {
    x: (PAGE_WIDTH - w) / 2,
    y: (PAGE_HEIGHT - h) / 2,
    width: w,
    height: h,
  });
}

/**
 * options:
 *  - profile: profile-template.json 結構
 *  - courses: [{ slug, data }] 依匯出順序排列
 *  - selectedReportPaths: 依 slug 對應要收錄的分組報告 PDF 路徑（fetch 取得 bytes，全班共用檔案）
 *  - selectedPhotoPaths: 要收錄的課堂照片路徑陣列
 *  - graduationCertificate: { dataUrl, isPng } 可選，個人畢業證書（瀏覽器記憶體內，非共用檔案）
 *  - graduationThesis: { bytes } 可選，個人畢業論文（瀏覽器記憶體內，非共用檔案）
 */
export async function generatePersonalizedPdf({
  profile,
  courses,
  selectedReportPaths = [],
  selectedPhotoPaths = [],
  graduationCertificate = null,
  graduationThesis = null,
}) {
  const pdfDoc = await PDFDocument.create();
  const cjkFont = await embedChineseFont(pdfDoc);
  const font = cjkFont; // 中英文皆用同一 CJK 字型，避免混排問題
  const boldFont = cjkFont;

  await buildCoverPage(pdfDoc, font, boldFont, profile);

  for (const { slug, data } of courses) {
    buildCoursePage(pdfDoc, font, boldFont, data);

    const reportPath = selectedReportPaths.find((p) => p.includes(slug));
    if (reportPath) {
      const res = await fetch(withBasePath(reportPath));
      const bytes = await res.arrayBuffer();
      await appendPdfBytes(pdfDoc, bytes);
    }
  }

  for (const photoPath of selectedPhotoPaths) {
    const res = await fetch(withBasePath(photoPath));
    const bytes = await res.arrayBuffer();
    await appendImagePage(pdfDoc, bytes, photoPath.toLowerCase().endsWith('.png'));
  }

  if (graduationCertificate?.dataUrl) {
    await appendImagePage(pdfDoc, graduationCertificate.dataUrl, graduationCertificate.isPng);
  }

  if (graduationThesis?.bytes) {
    await appendPdfBytes(pdfDoc, graduationThesis.bytes);
  }

  return pdfDoc.save();
}

export function downloadPdfBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
