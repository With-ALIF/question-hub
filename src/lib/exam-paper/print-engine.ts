import { renderMathInContent } from "@/lib/math";
import type { QuestionListItem } from "@/components/questions/QuestionCard";
import type { ExamPaperConfig } from "./types";
import { KATEX_INLINE_CSS } from "./katex-css";

const BANGLA_NUMERALS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const BANGLA_OPTIONS = ["(ক)", "(খ)", "(গ)", "(ঘ)", "(ঙ)", "(চ)"];
const BANGLA_OPTIONS_PLAIN = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];

export function toBanglaNumber(n: number | string): string {
  return String(n)
    .split("")
    .map((d) => (/\d/.test(d) ? BANGLA_NUMERALS[parseInt(d, 10)] : d))
    .join("");
}

function getAnswerLetter(q: QuestionListItem | undefined): string {
  if (!q) return "—";
  if (
    q.correct_option !== null &&
    q.correct_option !== undefined &&
    q.correct_option > 0
  ) {
    const idx = q.correct_option - 1;
    return BANGLA_OPTIONS_PLAIN[idx] ?? String(q.correct_option);
  }
  const raw = (q.answer || "").replace(/[()（）]/g, "").trim();
  const letterMap: Record<string, string> = {
    a: "ক", b: "খ", c: "গ", d: "ঘ", e: "ঙ", f: "চ",
    A: "ক", B: "খ", C: "গ", D: "ঘ", E: "ঙ", F: "চ",
    "1": "ক", "2": "খ", "3": "গ", "4": "ঘ", "5": "ঙ", "6": "চ",
    "১": "ক", "২": "খ", "৩": "গ", "৪": "ঘ", "৫": "ঙ", "৬": "চ",
    "ক": "ক", "খ": "খ", "গ": "গ", "ঘ": "ঘ", "ঙ": "ঙ", "চ": "চ",
  };
  return letterMap[raw] || raw || "—";
}

function renderAnswerGridTable(questionsList: QuestionListItem[]): string {
  const COLS = 10;
  const total = questionsList.length;
  if (total === 0) return "";
  const numRows = Math.ceil(total / COLS);
  const rowsHtml: string[] = [];

  for (let r = 0; r < numRows; r++) {
    const cellsHtml: string[] = [];
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      if (idx < total) {
        const q = questionsList[idx];
        const qNo = toBanglaNumber(idx + 1);
        const ansChar = getAnswerLetter(q);
        cellsHtml.push(`<td class="ans-grid-cell">${qNo}-${ansChar}</td>`);
      } else {
        cellsHtml.push(`<td class="ans-grid-cell">&nbsp;</td>`);
      }
    }
    rowsHtml.push(`<tr>${cellsHtml.join("")}</tr>`);
  }

  return `
    <table class="ans-grid-table">
      <tbody>
        ${rowsHtml.join("")}
      </tbody>
    </table>
  `;
}

function formatRichContent(
  html: string | null | undefined,
  text: string | null | undefined
): string {
  let content = "";
  const textTrimmed = (text || "").trim();
  const htmlTrimmed = (html || "").trim();

  if (htmlTrimmed && textTrimmed) {
    const htmlClean = htmlTrimmed.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (htmlClean === textTrimmed) {
      content = htmlTrimmed;
    } else {
      const imgMatches = htmlTrimmed.match(/<img[^>]+>/gi);
      if (imgMatches && imgMatches.length > 0) {
        content = `${imgMatches.join("<br/>")}<br/>${textTrimmed}`;
      } else {
        content = `${htmlTrimmed}<br/>${textTrimmed}`;
      }
    }
  } else {
    content = textTrimmed || htmlTrimmed || "";
  }

  if (!content) return "";

  // Ensure images load eagerly and with CORS support for canvas/print
  content = content.replace(/<img\b(?![^>]*\bcrossorigin=)/gi, '<img crossorigin="anonymous" loading="eager"');

  if (!/<(p|div|br|table|ul|ol|li)\b/i.test(content)) {
    content = content.replace(/\n/g, "<br/>");
  }

  return renderMathInContent(content);
}

function shuffleArray<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let m = arr.length;
  let s = seed;
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    const i = Math.floor((s / 233280) * m--);
    const t = arr[m]!;
    arr[m] = arr[i]!;
    arr[i] = t;
  }
  return arr;
}
function estimateQuestionHeight(q: QuestionListItem, qSize: number): number {
  let h = 6;
  const text = (q.question_text || "").trim();
  const html = (q.question_html || "").trim();
  const clean = (html.replace(/<[^>]*>/g, " ") || text).replace(/\s+/g, " ");

  // 350px column width fits ~45-50 chars per line at standard font size
  const charsPerLine = Math.max(40, Math.floor(350 / (qSize * 0.58)));
  const textLines = Math.max(1, Math.ceil(clean.length / charsPerLine));
  h += textLines * (qSize * 1.25);

  if (html.includes("katex-display") || html.includes("\\[") || html.includes("$$")) {
    h += 18;
  } else if (html.includes("katex") || html.includes("\\(") || html.includes("$")) {
    h += 4;
  }

  const imgMatches = html.match(/<img[^>]+>/gi);
  if (imgMatches) {
    h += imgMatches.length * 120;
  }

  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length > 0) {
    const optRows = Math.ceil(opts.length / 2);
    const hasOptImg = opts.some((o) => o.h && /<img/i.test(o.h));
    if (hasOptImg) {
      h += optRows * 65;
    } else {
      h += optRows * (qSize * 1.2 + 2);
    }
  }

  return Math.ceil(h);
}

type PageChunk = {
  left: { question: QuestionListItem; index: number }[];
  right: { question: QuestionListItem; index: number }[];
};

function findBestPageSplit(
  items: { question: QuestionListItem; index: number }[],
  maxColH: number,
  qSize: number
): { canFit: boolean; splitIdx: number } {
  const n = items.length;
  if (n === 0) return { canFit: true, splitIdx: 0 };
  if (n === 1) return { canFit: true, splitIdx: 1 };

  const heights = items.map((item) => estimateQuestionHeight(item.question, qSize));
  const totalH = heights.reduce((a, b) => a + b, 0);

  let bestSplit = -1;
  let minDiff = Infinity;

  // s is the count of items in Left column (from 1 to n - 1)
  let leftH = 0;
  for (let s = 1; s < n; s++) {
    leftH += heights[s - 1]!;
    const rightH = totalH - leftH;

    if (leftH <= maxColH && rightH <= maxColH) {
      const diff = Math.abs(leftH - rightH);
      if (diff < minDiff) {
        minDiff = diff;
        bestSplit = s;
      }
    }
  }

  if (bestSplit !== -1) {
    return { canFit: true, splitIdx: bestSplit };
  }

  // If strict fit is not found, pick split that minimizes the taller column
  let fallbackSplit = Math.ceil(n / 2);
  let minMaxH = Infinity;
  leftH = 0;
  for (let s = 1; s < n; s++) {
    leftH += heights[s - 1]!;
    const rightH = totalH - leftH;
    const maxH = Math.max(leftH, rightH);
    if (maxH < minMaxH) {
      minMaxH = maxH;
      fallbackSplit = s;
    }
  }

  // Allow up to 8% tolerance if close
  return { canFit: minMaxH <= maxColH * 1.08, splitIdx: fallbackSplit };
}

function paginateSetQuestions(
  items: QuestionListItem[],
  qSize: number
): PageChunk[] {
  const total = items.length;
  if (total === 0) return [];

  const PAGE_1_COL_CAP = 920;
  const SUB_PAGE_COL_CAP = 1000;
  const MAX_PAGE_ITEMS = 28;

  // Step 1: Pack questions into pages dynamically
  const pageItemGroups: { question: QuestionListItem; index: number }[][] = [];
  let currentIdx = 0;

  while (currentIdx < total) {
    const isFirstPage = pageItemGroups.length === 0;
    const maxColH = isFirstPage ? PAGE_1_COL_CAP : SUB_PAGE_COL_CAP;

    const currentGroup: { question: QuestionListItem; index: number }[] = [];

    while (currentIdx < total && currentGroup.length < MAX_PAGE_ITEMS) {
      const nextItem = { question: items[currentIdx]!, index: currentIdx + 1 };
      const testGroup = [...currentGroup, nextItem];

      if (testGroup.length <= 2) {
        currentGroup.push(nextItem);
        currentIdx++;
        continue;
      }

      const { canFit } = findBestPageSplit(testGroup, maxColH, qSize);
      if (canFit) {
        currentGroup.push(nextItem);
        currentIdx++;
      } else {
        break;
      }
    }

    if (currentGroup.length === 0 && currentIdx < total) {
      currentGroup.push({ question: items[currentIdx]!, index: currentIdx + 1 });
      currentIdx++;
    }

    pageItemGroups.push(currentGroup);
  }

  // Step 2: Prevent orphan questions (e.g. 1-3 leftover questions taking a whole new page)
  if (pageItemGroups.length > 1) {
    const lastGroup = pageItemGroups[pageItemGroups.length - 1]!;
    if (lastGroup.length <= 3) {
      const prevGroup = pageItemGroups[pageItemGroups.length - 2]!;
      const isPrevFirst = pageItemGroups.length === 2;
      const prevMaxColH = isPrevFirst ? PAGE_1_COL_CAP : SUB_PAGE_COL_CAP;

      // Always absorb if it can fit or combined is reasonable (<= 28 items)
      const combined = [...prevGroup, ...lastGroup];
      const { canFit: canAbsorb } = findBestPageSplit(combined, prevMaxColH * 1.15, qSize);

      if (canAbsorb || combined.length <= 28) {
        pageItemGroups[pageItemGroups.length - 2] = combined;
        pageItemGroups.pop();
      }
    }
  }

  // Step 3: Split each page group into Left and Right columns
  const pages: PageChunk[] = [];
  for (let pIdx = 0; pIdx < pageItemGroups.length; pIdx++) {
    const group = pageItemGroups[pIdx]!;
    const isFirst = pIdx === 0;
    const maxColH = isFirst ? PAGE_1_COL_CAP : SUB_PAGE_COL_CAP;

    const { splitIdx } = findBestPageSplit(group, maxColH, qSize);
    const leftCol = group.slice(0, splitIdx);
    const rightCol = group.slice(splitIdx);

    pages.push({ left: leftCol, right: rightCol });
  }

  return pages;
}

function renderQuestionItem(
  q: QuestionListItem,
  indexNumber: number,
  qSize: number
): string {
  const num = toBanglaNumber(indexNumber);
  const qHtml = formatRichContent(q.question_html, q.question_text);
  const opts = Array.isArray(q.options) ? q.options : [];

  return `
  <div class="q-item">
    <div class="q-text">
      <span class="q-num">${num}.</span>
      <span>${qHtml}</span>
    </div>
    ${
      opts.length > 0
        ? `
      <div class="q-options">
        ${opts
          .map((opt, oIdx) => {
            const optLabel = BANGLA_OPTIONS[oIdx] ?? `(${oIdx + 1})`;
            const optText = formatRichContent(opt.h, opt.t);
            return `
            <div class="q-opt">
              <span class="q-opt-label">${optLabel}</span>
              <span>${optText}</span>
            </div>
          `;
          })
          .join("")}
      </div>
    `
        : ""
    }
  </div>
`;
}

export function generateExamPaperHtml(
  questions: QuestionListItem[],
  config: ExamPaperConfig
): string {
  const sets = config.hasFourSets ? ["A", "B", "C", "D"] : ["A"];
  const watermarkOpacity = (config.watermarkOpacity ?? 90) / 100;
  const qSize = config.questionSize ?? 11;
  const hSize = config.headerSize ?? 24;
  const hasExplanations = questions.some((q) => Boolean(q.explanation || q.explanation_html));

  const setsData = sets.map((setName, setIdx) => {
    const list = setIdx === 0 ? questions : shuffleArray(questions, setIdx * 42 + 13);
    return {
      name: setName,
      questions: list,
    };
  });

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>${config.title || "পরীক্ষাপত্র"}</title>
  <style id="katex-inline-css">
    ${KATEX_INLINE_CSS}
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" crossorigin="anonymous" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* KaTeX layout stabilization for PDF/canvas rendering */
    .katex {
      display: inline-block;
      white-space: nowrap;
    }
    .katex-display {
      display: block;
      margin: 0.5em 0;
      text-align: center;
    }
    .katex .frac-line {
      min-height: 1.2px;
      border-bottom-style: solid;
    }

    @page {
      size: A4;
      margin: 10mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Hind Siliguri', 'Kalpurush', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.38;
    }
    .page-set {
      position: relative;
    }
    .page-set + .page-set {
      page-break-before: always;
    }
    .watermark-text {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 72px;
      font-weight: 800;
      color: rgba(15, 23, 42, ${1 - watermarkOpacity});
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
      user-select: none;
    }
    .watermark-img {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 320px;
      max-height: 320px;
      opacity: ${1 - watermarkOpacity};
      pointer-events: none;
      z-index: 0;
      user-select: none;
    }
    .paper-header {
      position: relative;
      z-index: 1;
      text-align: center;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .paper-title {
      font-size: ${hSize}px;
      font-weight: 700;
      margin: 0 0 4px;
      line-height: 1.2;
    }
    .paper-subtitle {
      font-size: 13px;
      font-weight: 600;
      margin: 2px 0;
      color: #334155;
    }
    .paper-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      margin-top: 6px;
      color: #1e293b;
    }
    .set-badge {
      display: inline-block;
      border: 1.5px solid #0f172a;
      padding: 1px 8px;
      font-size: 12px;
      font-weight: 800;
      border-radius: 4px;
    }
    .exam-page {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      background: #ffffff;
    }
    .exam-page + .exam-page {
      page-break-before: always;
      break-before: page;
    }
    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .paper-columns {
      display: flex;
      align-items: stretch;
      gap: 16px;
      position: relative;
      z-index: 1;
    }
    .paper-col {
      flex: 1;
      min-width: 0;
    }
    .paper-col-divider {
      width: 1px;
      background: #cbd5e1;
      align-self: stretch;
      flex-shrink: 0;
    }
    .q-item {
      font-size: ${qSize}px;
      margin-bottom: 7px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .q-text {
      margin-bottom: 2px;
      font-weight: 500;
    }
    .q-num {
      font-weight: 700;
      margin-right: 4px;
    }
    .q-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 6px;
      margin-top: 2.5px;
      font-size: ${Math.max(qSize - 1, 9)}px;
    }
    .q-opt {
      display: flex;
      align-items: flex-start;
      gap: 3px;
    }
    .q-opt-label {
      font-weight: 600;
      color: #334155;
    }
    .answer-key-page,
    .explanations-page {
      page-break-before: always;
      position: relative;
      z-index: 1;
    }
    .answer-key-page {
      page-break-before: always;
      position: relative;
      z-index: 1;
      box-sizing: border-box;
      width: 100%;
      background: #ffffff;
      padding-top: 10px;
    }
    .ans-sheet-header {
      text-align: center;
      margin-bottom: 12px;
    }
    .ans-sheet-title {
      font-size: 20px;
      font-weight: 800;
      color: #000000;
      margin: 0 0 8px 0;
      letter-spacing: 0.5px;
    }
    .ans-sheet-divider {
      width: 100%;
      height: 2px;
      background: #000000;
      margin-bottom: 14px;
    }
    .ans-set-block {
      margin-bottom: 18px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ans-set-badge {
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      border: 1.5px solid #0f172a;
      padding: 1px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .ans-grid-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 0 0 16px 0;
    }
    .ans-grid-cell {
      border: 1px solid #000000;
      padding: 5px 2px;
      text-align: center;
      font-size: 12.5px;
      font-weight: 600;
      color: #000000;
      width: 10%;
      white-space: nowrap;
      vertical-align: middle;
      line-height: 1.25;
    }
    .ans-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin: 12px 0;
    }
    .ans-table th, .ans-table td {
      border: 1px solid #94a3b8;
      padding: 4px 6px;
      text-align: center;
    }
    .ans-table th {
      background: #f1f5f9;
      font-weight: 700;
    }
    .explanations {
      margin-top: 14px;
      position: relative;
      z-index: 1;
      column-count: 2;
      column-gap: 18px;
      column-rule: 1px solid #cbd5e1;
    }
    .exp-item {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      font-size: 11px;
      padding: 8px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #6366f1;
      border-radius: 6px;
      margin-bottom: 10px;
      break-inside: avoid;
      break-inside: avoid-column;
      page-break-inside: avoid;
    }
    .exp-header {
      font-size: 11.5px;
      font-weight: 700;
      color: #3730a3;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .exp-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #6366f1;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
    }
    .exp-text {
      color: #1e1b4b;
      line-height: 1.6;
      word-break: break-word;
    }
    .exp-text img {
      max-width: 100%;
      height: auto;
      margin: 6px 0;
      display: block;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  ${
    config.watermarkImageUrl
      ? `<img class="watermark-img" src="${config.watermarkImageUrl}" alt="watermark" />`
      : config.watermarkText
        ? `<div class="watermark-text">${config.watermarkText}</div>`
        : ""
  }

  ${setsData
    .map((s) => {
      const pages = paginateSetQuestions(s.questions, qSize);
      return `
    <div class="page-set">
      ${pages
        .map((p, pIdx) => {
          const isFirst = pIdx === 0;
          return `
        <div class="exam-page ${isFirst ? "first-page" : "subsequent-page"}">
          ${
            isFirst
              ? `
            <header class="paper-header">
              <h1 class="paper-title">${config.title || "পরীক্ষাপত্র"}</h1>
              ${config.subtitle ? `<div class="paper-subtitle">${config.subtitle}</div>` : ""}
              <div class="paper-meta-row">
                <div>${config.tutorName ? `শিক্ষক: ${config.tutorName}` : ""}</div>
                ${config.hasFourSets ? `<div class="set-badge">সেট: ${s.name}</div>` : ""}
                <div>পূর্ণমান: ${toBanglaNumber(config.marks || s.questions.length)} &nbsp;|&nbsp; সময়: ${config.time || "৫০ মিনিট"}</div>
              </div>
            </header>
            `
              : `
            <header class="running-header">
              <div>${config.title || "পরীক্ষাপত্র"} ${config.hasFourSets ? `(সেট: ${s.name})` : ""}</div>
              <div>পৃষ্ঠা ${toBanglaNumber(pIdx + 1)}</div>
            </header>
            `
          }

          <div class="paper-columns">
            <div class="paper-col col-left">
              ${p.left.map((item) => renderQuestionItem(item.question, item.index, qSize)).join("")}
            </div>
            <div class="paper-col-divider"></div>
            <div class="paper-col col-right">
              ${p.right.map((item) => renderQuestionItem(item.question, item.index, qSize)).join("")}
            </div>
          </div>
        </div>
      `;
        })
        .join("")}
    </div>
  `;
    })
    .join("")}

  ${
    config.withAnswers
      ? `
    <div class="answer-key-page">
      <div class="ans-sheet-header">
        <h1 class="ans-sheet-title">উত্তর তালিকা</h1>
        <div class="ans-sheet-divider"></div>
      </div>

      ${
        setsData.length > 1
          ? setsData
              .map(
                (s) => `
        <div class="ans-set-block">
          <div class="ans-set-badge">সেট: ${s.name}</div>
          ${renderAnswerGridTable(s.questions)}
        </div>
      `
              )
              .join("")
          : renderAnswerGridTable(setsData[0]?.questions || questions)
      }
    </div>

    ${
      hasExplanations
        ? `
    <div class="explanations-page">
      <header class="paper-header">
        <h1 class="paper-title">বিস্তারিত ব্যাখ্যা ও সমাধান</h1>
        <div class="paper-subtitle">${config.title || "পরীক্ষাপত্র"}</div>
      </header>

      <div class="explanations">
        ${questions
          .map((q, idx) => {
            const hasExp = Boolean(q.explanation || q.explanation_html);
            if (!hasExp) return "";
            const expText = formatRichContent(q.explanation_html, q.explanation);
            return `
            <div class="exp-item">
              <div class="exp-header">
                <span class="exp-badge">${toBanglaNumber(idx + 1)}</span>
                <span>${toBanglaNumber(idx + 1)} নং প্রশ্নের সমাধান:</span>
              </div>
              <div class="exp-text">${expText}</div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
    `
        : ""
    }
  `
      : ""
  }
</body>
</html>
  `;
}

export type PdfProgressStatus = {
  step: "init" | "fonts" | "images" | "math" | "pdf" | "done";
  percent: number;
  message: string;
  totalImages?: number;
  loadedImages?: number;
};

async function waitForAllImages(
  targetDoc: Document,
  timeoutMs = 8000,
  onImageProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const images = Array.from(targetDoc.querySelectorAll<HTMLImageElement>("img"));
  if (images.length === 0) {
    onImageProgress?.(0, 0);
    return;
  }

  let loadedCount = 0;
  const total = images.length;
  onImageProgress?.(0, total);

  const loadPromises = images.map((img) => {
    if (img.complete && img.naturalWidth > 0) {
      loadedCount++;
      onImageProgress?.(loadedCount, total);
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          loadedCount++;
          onImageProgress?.(loadedCount, total);
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        }
      };
      img.addEventListener("load", done);
      img.addEventListener("error", done);
      if (img.complete) done();
    });
  });

  await Promise.race([
    Promise.all(loadPromises),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

export async function printExamPaper(
  htmlContent: string,
  onProgress?: (status: PdfProgressStatus) => void
): Promise<void> {
  if (typeof window === "undefined") return;

  onProgress?.({
    step: "init",
    percent: 15,
    message: "প্রিন্ট পেপার প্রস্তুত করা হচ্ছে...",
  });

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  try {
    const iWin = iframe.contentWindow;
    const doc = iWin?.document || iframe.contentDocument;
    if (!doc || !iWin) throw new Error("Iframe print document access error");

    doc.open();
    doc.write(htmlContent);
    doc.close();

    onProgress?.({
      step: "fonts",
      percent: 35,
      message: "ফন্ট ও পেজ ফরম্যাট লোড হচ্ছে...",
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (doc.fonts) {
      try {
        await Promise.allSettled([
          doc.fonts.load("1em KaTeX_Main"),
          doc.fonts.load("1em KaTeX_Math"),
          doc.fonts.ready,
        ]);
      } catch {}
    }

    onProgress?.({
      step: "images",
      percent: 60,
      message: "ছবি ও ব্যাখ্যা প্রস্তুত হচ্ছে...",
    });

    await waitForAllImages(doc, 7000, (loaded, total) => {
      if (total > 0) {
        const pct = 60 + Math.round((loaded / total) * 25);
        onProgress?.({
          step: "images",
          percent: Math.min(85, pct),
          message: `ছবি ও ব্যাখ্যা লোড হচ্ছে (${toBanglaNumber(loaded)}/${toBanglaNumber(total)})...`,
          loadedImages: loaded,
          totalImages: total,
        });
      }
    });

    onProgress?.({
      step: "math",
      percent: 90,
      message: "গাণিতিক প্রতীক ও সূত্র সাজানো হচ্ছে...",
    });

    fixKatexSvgRadicals(doc);

    onProgress?.({
      step: "done",
      percent: 100,
      message: "প্রস্তুত! প্রিন্ট ডায়ালগ ওপেন হচ্ছে...",
    });

    // Brief layout settle before triggering print dialog
    await new Promise((resolve) => setTimeout(resolve, 300));

    iWin.focus();
    iWin.print();
  } finally {
    // Keep iframe temporarily for print dialog, then safely remove
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 60000);
  }
}

function loadScriptInWindow(targetWindow: Window, src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((targetWindow as any).html2pdf) {
      resolve((targetWindow as any).html2pdf);
      return;
    }
    const script = targetWindow.document.createElement("script");
    script.src = src;
    script.onload = () => resolve((targetWindow as any).html2pdf);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    targetWindow.document.head.appendChild(script);
  });
}

function fixKatexSvgRadicals(targetDoc: Document): void {
  // 1. Fix radical square roots (\sqrt) in KaTeX (.hide-tail wrapper containing stretchy SVG)
  const hideTails = targetDoc.querySelectorAll<HTMLElement>(".katex .hide-tail");
  hideTails.forEach((ht) => {
    const svg = ht.querySelector<SVGElement>("svg");
    if (!svg) return;
    const rect = ht.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w > 0 && h > 0) {
      const vb = svg.getAttribute("viewBox");
      if (vb) {
        const parts = vb.trim().split(/\s+/);
        if (parts.length === 4 && parts[2] === "400000" && parts[3]) {
          const vbHeight = parseFloat(parts[3]);
          if (vbHeight > 0) {
            // KaTeX draws stretchy root with viewBox="0 0 400000 <vbHeight>".
            // Replace 400000 with exact width proportional to rendered height so aspect ratio is 1:1
            const newVbWidth = Math.round(w * (vbHeight / h));
            svg.setAttribute("viewBox", `0 0 ${newVbWidth} ${vbHeight}`);
            svg.setAttribute("preserveAspectRatio", "none");
          }
        }
      }
      const roundedW = `${Math.round(w)}px`;
      const roundedH = `${Math.round(h)}px`;
      svg.setAttribute("width", roundedW);
      svg.setAttribute("height", roundedH);
      svg.style.width = roundedW;
      svg.style.height = roundedH;
      svg.setAttribute("fill", "#0f172a");
      svg.setAttribute("stroke", "#0f172a");
    }
  });

  // 2. Fix other KaTeX SVGs (stretchy arrows, accents, delimiters)
  targetDoc.querySelectorAll<SVGElement>(".katex svg").forEach((svg) => {
    const currentW = svg.getAttribute("width");
    if (!currentW || currentW.includes("em") || currentW.includes("%")) {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const roundedW = `${Math.round(rect.width)}px`;
        const roundedH = `${Math.round(rect.height)}px`;
        svg.setAttribute("width", roundedW);
        svg.setAttribute("height", roundedH);
        svg.style.width = roundedW;
        svg.style.height = roundedH;
        svg.setAttribute("fill", "#0f172a");
        svg.setAttribute("stroke", "#0f172a");
      }
    }
  });
}

export async function downloadExamPaperPdf(
  htmlContent: string,
  filename: string = "exam-paper",
  onProgress?: (status: PdfProgressStatus) => void
): Promise<void> {
  if (typeof window === "undefined") return;

  onProgress?.({
    step: "init",
    percent: 15,
    message: "ডকুমেন্ট ও পরীক্ষাপত্র কাঠামো প্রস্তুত হচ্ছে...",
  });

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "794px"; 
  iframe.style.height = "1123px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  try {
    const iWin = iframe.contentWindow;
    const doc = iWin?.document || iframe.contentDocument;
    if (!doc || !iWin) throw new Error("Iframe document access error");

    // Patch getComputedStyle to prevent html2canvas lab/oklch color parse crashes
    const origGetComputedStyle = iWin.getComputedStyle;
    if (origGetComputedStyle) {
      iWin.getComputedStyle = function (el: Element, pseudo?: string | null) {
        const style = origGetComputedStyle.call(this, el, pseudo);
        return new Proxy(style, {
          get(target: any, prop: string | symbol) {
            const val = target[prop];
            if (typeof val === "string" && (val.includes("lab(") || val.includes("oklch("))) {
              return "#0f172a";
            }
            if (typeof val === "function") {
              return function (...args: any[]) {
                const res = val.apply(target, args);
                if (typeof res === "string" && (res.includes("lab(") || res.includes("oklch("))) {
                  return "#0f172a";
                }
                return res;
              };
            }
            return val;
          },
        });
      };
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    onProgress?.({
      step: "fonts",
      percent: 30,
      message: "বাংলা ও গণিত ফন্ট লোড হচ্ছে...",
    });

    // Load html2pdf directly inside the iframe window to avoid parent document stylesheets
    let html2pdfInstance = (iWin as any).html2pdf;
    if (!html2pdfInstance) {
      try {
        html2pdfInstance = await loadScriptInWindow(
          iWin,
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        );
      } catch {
        html2pdfInstance = await loadScriptInWindow(
          iWin,
          "https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"
        );
      }
    }

    if (!html2pdfInstance) {
      throw new Error("Could not initialize html2pdf inside document sandbox");
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    if (doc.fonts) {
      try {
        await Promise.allSettled([
          doc.fonts.load("1em KaTeX_Main"),
          doc.fonts.load("1em KaTeX_Math"),
          doc.fonts.load("1em KaTeX_Size1"),
          doc.fonts.load("1em KaTeX_Size2"),
          doc.fonts.ready,
        ]);
      } catch {}
    }

    onProgress?.({
      step: "images",
      percent: 50,
      message: "প্রশ্ন ও ব্যাখ্যার ছবি প্রস্তুত হচ্ছে...",
    });

    // Wait for all explanation diagrams and images to finish loading from network
    await waitForAllImages(doc, 8000, (loaded, total) => {
      if (total > 0) {
        const pct = 50 + Math.round((loaded / total) * 22);
        onProgress?.({
          step: "images",
          percent: Math.min(72, pct),
          message: `প্রশ্ন ও ব্যাখ্যার ছবি লোড হচ্ছে (${toBanglaNumber(loaded)}/${toBanglaNumber(total)})...`,
          totalImages: total,
          loadedImages: loaded,
        });
      }
    });

    onProgress?.({
      step: "math",
      percent: 75,
      message: "KaTeX গাণিতিক সমীকরণ ও রুট সাইন সাজানো হচ্ছে...",
    });

    // Extra tick for browser layout engine to settle with image dimensions
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Fix KaTeX SVGs (especially square root radical hooks) before html2canvas captures
    fixKatexSvgRadicals(doc);

    onProgress?.({
      step: "pdf",
      percent: 85,
      message: "পাতা বিন্যাস ও PDF ফাইল রেন্ডার হচ্ছে...",
    });

    const cleanName = (filename || "exam-paper")
      .trim()
      .replace(/[/\\?%*:|"<>]/g, "_");

    // Suppress benign html2canvas color warnings
    const origWinWarn = window.console.warn;
    const iWinConsole = (iWin as Window & { console?: Console }).console;
    const origIWinWarn = iWinConsole?.warn;
    const filterWarn = (...args: any[]) => {
      if (typeof args[0] === "string" && args[0].includes("unsupported color function")) {
        return;
      }
      origWinWarn.apply(window.console, args);
    };
    window.console.warn = filterWarn;
    if (origIWinWarn && iWinConsole) iWinConsole.warn = filterWarn;

    // 2. Patch window.getComputedStyle on parent window during canvas rendering
    const origWinGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (el: Element, pseudo?: string | null) {
      const style = origWinGetComputedStyle.call(window, el, pseudo);
      return new Proxy(style, {
        get(target: any, prop: string | symbol) {
          const val = target[prop];
          if (typeof val === "string" && (val.includes("lab(") || val.includes("oklch("))) {
            return val.replace(/oklch\([^)]+\)/g, "#0f172a").replace(/lab\([^)]+\)/g, "#0f172a");
          }
          if (typeof val === "function") {
            return function (...args: any[]) {
              const res = val.apply(target, args);
              if (typeof res === "string" && (res.includes("lab(") || res.includes("oklch("))) {
                return res.replace(/oklch\([^)]+\)/g, "#0f172a").replace(/lab\([^)]+\)/g, "#0f172a");
              }
              return res;
            };
          }
          return val;
        },
      });
    };

    const opt = {
      margin: 8,
      filename: `${cleanName}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 794,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc: Document) => {
          fixKatexSvgRadicals(clonedDoc);
        },
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
        before: [".exam-page + .exam-page", ".page-set + .page-set", ".answer-key-page", ".explanations-page"],
        avoid: [".q-item", ".exp-item", "tr", ".ans-grid-table"],
      },
    };

    // Dynamic ticker while html2pdf compiles and captures canvas
    let currentPct = 85;
    const progressTicker = setInterval(() => {
      if (currentPct < 96) {
        currentPct += 1;
        onProgress?.({
          step: "pdf",
          percent: currentPct,
          message: "PDF পাতা তৈরি ও ফাইল চূড়ান্ত হচ্ছে...",
        });
      }
    }, 150);

    try {
      await html2pdfInstance().set(opt).from(doc.body).save();
      clearInterval(progressTicker);
      onProgress?.({
        step: "done",
        percent: 100,
        message: "PDF তৈরি সম্পন্ন! ফাইল ডাউনলোড শুরু হচ্ছে...",
      });
    } catch (err) {
      clearInterval(progressTicker);
      throw err;
    } finally {
      window.console.warn = origWinWarn;
      if (origIWinWarn && iWinConsole) iWinConsole.warn = origIWinWarn;
      window.getComputedStyle = origWinGetComputedStyle;
    }
  } finally {
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 2000);
  }
}
