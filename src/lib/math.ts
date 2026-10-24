import asciimathModule from "asciimath-to-latex";
import katex from "katex";

type ConverterFunction = (str: string) => string;
const ascii2latex: ConverterFunction =
  (asciimathModule as unknown as { default: ConverterFunction }).default ||
  (asciimathModule as unknown as ConverterFunction);

const NON_MATH_WORDS = new Set([
  "none",
  "all",
  "both",
  "neither",
  "true",
  "false",
  "yes",
  "no",
  "done",
  "skip",
  "increase",
  "decrease",
  "constant",
  "zero",
  "infinity",
]);

const MATH_KEYWORDS = new Set([
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "cosec",
  "log",
  "ln",
  "lim",
  "int",
  "root",
  "sqrt",
  "alpha",
  "beta",
  "gamma",
  "theta",
  "lambda",
  "mu",
  "pi",
  "sigma",
  "omega",
  "hati",
  "hatj",
  "hatk",
  "exp",
  "det",
  "matrix",
]);

export function cleanMathString(expr: string): string {
  let s = String(expr).trim();
  s = s.replace(/[\u2010-\u2015\u2212]/g, "-");
  s = s.replace(/[\u00D7\u22C5\u2219]/g, " * ");
  s = s.replace(/\u00F7/g, " / ");
  s = s.replace(/×/g, " xx ");
  s = s.replace(/[\u00A0\u200B\uFEFF]/g, " ");
  s = s.replace(/\u0251/g, "alpha");
  s = s.replace(/α/g, "alpha");
  s = s.replace(/β/g, "beta");
  s = s.replace(/γ/g, "gamma");
  s = s.replace(/δ/g, "delta");
  s = s.replace(/θ/g, "theta");
  s = s.replace(/λ/g, "lambda");
  s = s.replace(/\blamda\b/gi, "lambda");
  s = s.replace(/μ/g, "mu");
  s = s.replace(/π/g, "pi");
  s = s.replace(/σ/g, "sigma");
  s = s.replace(/ω/g, "omega");
  s = s.replace(/Δ/g, "Delta");
  s = s.replace(/Φ/g, "Phi");
  s = s.replace(/Ω/g, "Omega");
  s = s.replace(/∞/g, "oo");
  s = s.replace(/≤/g, "<=");
  s = s.replace(/≥/g, ">=");
  s = s.replace(/≠/g, "!=");
  s = s.replace(/±/g, "+-");
  s = s.replace(/→/g, "->");
  s = s.replace(/¹/g, "^1");
  s = s.replace(/²/g, "^2");
  s = s.replace(/³/g, "^3");
  s = s.replace(/⁴/g, "^4");
  s = s.replace(/⁵/g, "^5");
  s = s.replace(/⁶/g, "^6");
  s = s.replace(/⁷/g, "^7");
  s = s.replace(/⁸/g, "^8");
  s = s.replace(/⁹/g, "^9");
  s = s.replace(/⁰/g, "^0");
  s = s.replace(/⁻/g, "^-");
  s = s.replace(/⁺/g, "^+");
  s = s.replace(/₀/g, "_0");
  s = s.replace(/₁/g, "_1");
  s = s.replace(/₂/g, "_2");
  s = s.replace(/₃/g, "_3");
  s = s.replace(/₄/g, "_4");
  s = s.replace(/₅/g, "_5");
  s = s.replace(/₆/g, "_6");
  s = s.replace(/₇/g, "_7");
  s = s.replace(/₈/g, "_8");
  s = s.replace(/₉/g, "_9");
  s = s.replace(/\b([0-9]*)I([1-9])\b/g, (_m: string, p1?: string, p2?: string) => (p1 || "") + "I_" + (p2 || ""));
  s = s.replace(/\b([A-Z])([2-9])(?=\s*[-+*=/]|\s*=\?|$)/g, (_m: string, p1?: string, p2?: string) => (p1 || "") + "^" + (p2 || ""));
  s = s.replace(/(?:([a-zA-Z]\s*=\s*))?\(\s*(\[[^\]]+\](?:\s*,\s*\[[^\]]+\])+)\s*\)/g, (_m: string, v?: string, rows?: string) => (v || "") + "[" + (rows || "") + "]");
  return s.trim();
}

export function renderAsciiMath(expr: string, displayMode = false): string {
  try {
    const cleaned = cleanMathString(expr);
    if (!cleaned) return "";
    const tex = ascii2latex(cleaned);
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
  } catch {
    return expr;
  }
}

export function renderLatex(tex: string, displayMode = false): string {
  try {
    const cleaned = cleanMathString(tex);
    if (!cleaned) return "";
    return katex.renderToString(cleaned, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
  } catch {
    return tex;
  }
}

export function isPureMath(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  if (/[\u0980-\u09FF]/.test(trimmed)) return false;

  if (NON_MATH_WORDS.has(trimmed.toLowerCase().replace(/\.$/, ""))) return false;

  const spaceWords = trimmed
    .split(/\s+/)
    .filter((w) => /^[a-zA-Z]{2,}$/.test(w) && !MATH_KEYWORDS.has(w.toLowerCase()));
  if (spaceWords.length >= 3) return false;

  if (/^(?:[A-Za-z]\s*=\s*)?\[\[[\s\S]*\]\]$/.test(trimmed)) return true;
  if (/^(?:[A-Za-z]\s*=\s*)?\(\s*\[[\s\S]*\]\s*\)$/.test(trimmed)) return true;
  if (/^(?:[-+]?\d*\/?\d*)?\[\[[\s\S]*\]\]$/.test(trimmed)) return true;
  if (/^(?:[-+]?\d*\/?\d*)?\[\([\s\S]*\)\]$/.test(trimmed)) return true;
  if (/^\|[\s\S]*\|(?:\s*(?:=|!=|<=|>=|<|>)\s*[-+]?[0-9a-zA-Z\/\.\+\-\?λ]*)?$/.test(trimmed)) return true;
  if (/^(?:abs|det|matrix)\s*\([\s\S]*\)(?:\s*(?:=|!=|<=|>=|<|>)\s*[-+]?[0-9a-zA-Z\/\.\+\-\?λ]*)?$/.test(trimmed)) return true;

  if (/^(?:[-+]?\d*\/?\d*)?\[[\s\S]*\](?:\^[-+]?[0-9a-zA-Z\(\)]+)?$/.test(trimmed)) return true;

  if (/[\[\]\(\)\{\}\^_\+\*\/\=\<\>\|\\~%]/.test(trimmed)) return true;

  if (
    /\b(?:sin|cos|tan|cot|sec|csc|cosec|ln|log|lim|int|sqrt|root|pi|alpha|beta|theta|hati|hatj|hatk|abs|det|matrix)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  if (/^[-+]?[0-9a-zA-Z]+(?:\/[0-9a-zA-Z]+)?$/.test(trimmed)) return true;

  return false;
}

function extractBalanced(
  text: string,
  prefixRegex: RegExp,
  openChar: string,
  closeChar: string,
): { raw: string; start: number; end: number }[] {
  const matches: { raw: string; start: number; end: number }[] = [];
  const re = new RegExp(prefixRegex.source, "gi");
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const startIdx = m.index;
    const parenStart = text.indexOf(openChar, startIdx);
    if (parenStart === -1) continue;

    let depth = 0;
    let endIdx = -1;
    for (let i = parenStart; i < text.length; i++) {
      if (text[i] === openChar) depth++;
      else if (text[i] === closeChar) {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      const rest = text.slice(endIdx);
      const opMatch = rest.match(/^\s*(?:=|!=|<=|>=|<|>)\s*[-+]?[0-9a-zA-Z\/\.\+\-]+/);
      const totalEnd = opMatch ? endIdx + opMatch[0].length : endIdx;
      matches.push({
        raw: text.slice(startIdx, totalEnd),
        start: startIdx,
        end: totalEnd,
      });
      re.lastIndex = totalEnd;
    }
  }

  return matches;
}

export function renderMathInContent(raw: string | null | undefined): string {
  if (!raw) return "";
  let content = String(raw).trim();

  // 1. Convert Markdown images: ![alt](url) -> <img src="url" alt="alt" loading="lazy" />
  content = content.replace(
    /!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy" />',
  );

  // 2. Convert standalone image URLs into <img> tags
  content = content.replace(
    /(?<=^|\s)(https?:\/\/[^\s<>]+\.(?:png|jpg|jpeg|webp|gif|svg))(?=$|\s)/gi,
    '<img src="$1" alt="Explanation image" loading="lazy" />',
  );

  // 3. Convert HTML <sup> and <sub> tags before stripping
  content = content
    .replace(/<sup>(.*?)<\/sup>/gi, "^{$1}")
    .replace(/<sub>(.*?)<\/sub>/gi, "_{$1}");

  // 4. Normalize shorthands like I3 -> I_3, 2I3 -> 2I_3, A3 -> A^3
  content = content.replace(/\b([0-9]*)I([1-9])\b/g, (_m: string, p1?: string, p2?: string) => (p1 || "") + "I_" + (p2 || ""));
  content = content.replace(/\b([A-Z])([2-9])(?=\s*[-+*=/]|\s*=\?|$)/g, (_m: string, p1?: string, p2?: string) => (p1 || "") + "^" + (p2 || ""));

  const textWithoutTags = content.replace(/<[^>]*>/g, "").trim();
  if (isPureMath(textWithoutTags) && !content.includes("class=\"katex\"")) {
    return renderAsciiMath(textWithoutTags, false);
  }

  const placeholders: string[] = [];
  const stash = (rendered: string) => {
    const key = `@@KATEX_${placeholders.length}@@`;
    placeholders.push(rendered);
    return key;
  };

  content = content.replace(
    /<(span|p|div)\b[^>]*\bclass=["'][^"']*mathy[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi,
    (_match, tag, inner) => {
      let clean = inner.replace(/<[^>]*>/g, "").trim();
      if (!clean) return "";
      clean = clean.replace(/(?:([a-zA-Z]\s*=\s*))?\(\s*(\[[^\]]+\](?:\s*,\s*\[[^\]]+\])+)\s*\)/g, (_m: string, v?: string, rows?: string) => (v || "") + "[" + (rows || "") + "]");
      const isDisplay = tag.toLowerCase() === "p" || tag.toLowerCase() === "div";
      return stash(renderAsciiMath(clean, isDisplay));
    },
  );

  // Stash all HTML tags (including <img>, <p>, <span>) so math regexes never corrupt attributes or URLs
  const htmlTags: string[] = [];
  content = content.replace(/<[^>]+>/g, (tag) => {
    const key = `@@HTML_TAG_${htmlTags.length}@@`;
    htmlTags.push(tag);
    return key;
  });

  content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => stash(renderLatex(math, true)));
  content = content.replace(/\\\[([\s\S]+?)\\\]/g, (_match, math) => stash(renderLatex(math, true)));

  content = content.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (_match, math) =>
    stash(renderLatex(math, false)),
  );
  content = content.replace(/\\\(([\s\S]+?)\\\)/g, (_match, math) =>
    stash(renderLatex(math, false)),
  );

  // Matrix tuples: A = ([2, 0, 0], [0, 2, 0], [0, 0, 2])
  content = content.replace(
    /(?:([A-Za-z]\s*=\s*))?\(\s*(\[[^\]]+\](?:\s*,\s*\[[^\]]+\])+)\s*\)/g,
    (_match: string, v?: string, rows?: string) => {
      const expr = (v || "") + "[" + (rows || "") + "]";
      return stash(renderAsciiMath(expr, false));
    },
  );

  const balancedCalls = extractBalanced(content, /\b(?:abs|det|matrix)\s*\(/, "(", ")");
  for (let i = balancedCalls.length - 1; i >= 0; i--) {
    const item = balancedCalls[i];
    if (item) {
      const key = stash(renderAsciiMath(item.raw, false));
      content = content.slice(0, item.start) + key + content.slice(item.end);
    }
  }

  const balancedBrackets = extractBalanced(content, /(?:[a-zA-Z]\s*=\s*)?\[\s*[\(\[]/, "[", "]");
  for (let i = balancedBrackets.length - 1; i >= 0; i--) {
    const item = balancedBrackets[i];
    if (item) {
      const key = stash(renderAsciiMath(item.raw, false));
      content = content.slice(0, item.start) + key + content.slice(item.end);
    }
  }

  content = content.replace(/(?:[-+]?\d*\/?\d*)?\[\[[\s\S]*?\]\]/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );

  content = content.replace(
    /(?:[-+]?\d*\/?\d*)?\[[0-9a-zA-Z_^\-\+\*\/\(\)\|\<\>\=\,\.\s]+\](?:\^[0-9a-zA-Z\(\)]+)?/g,
    (match) => stash(renderAsciiMath(match, false)),
  );

  content = content.replace(
    /(?:[A-Za-z]\s*=\s*)?\|\s*\([^\u0980-\u09FF|]+\)\s*\|(?:\s*(?:=|!=|<=|>=|<|>)\s*(?:[^\u0980-\u09FF\n\r,;|।]+)?)?/g,
    (match) => {
      const trimmed = match.trim().replace(/[\s,;\u0964\u0965]+$/, "");
      return stash(renderAsciiMath(trimmed, false));
    },
  );

  content = content.replace(
    /\|[a-zA-Z0-9_\^\-\+\*\/\(\)\,\s\\]+\|(?:(?:\^[-+]?[0-9a-zA-Z\(\)]+)?|\s*(?:=|!=|<=|>=|<|>)\s*[-+]?[0-9a-zA-Z\/\.\+\-\?λ]*)?/g,
    (match) => {
      const trimmed = match.trim();
      if (trimmed === "|" || trimmed === "||" || trimmed === "| |") return match;
      return stash(renderAsciiMath(trimmed, false));
    },
  );

  content = content.replace(
    /\bint(?:_[0-9a-zA-Z^]+(?:\^[0-9a-zA-Z_]+)?)?[\s\S]*?d[xyz\theta t]/g,
    (match) => stash(renderAsciiMath(match, false)),
  );

  content = content.replace(/\blim_\([^\)]+\)[A-Za-z0-9_\^\-\+\*\/\(\)]+/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );

  content = content.replace(/\([0-9a-zA-Z\s\+\-\*]*hat[ijk][0-9a-zA-Z\s\+\-\*]*\)/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );

  content = content.replace(
    /(?:vec|hat)[a-zA-Z](?:[0-9a-zA-Z_\^\-\+\*\/\s]*[a-zA-Z0-9])?/g,
    (match) => {
      if (match.length <= 4 && !match.startsWith("hat") && !match.startsWith("vec")) return match;
      return stash(renderAsciiMath(match, false));
    },
  );

  content = content.replace(
    /(?:(?<=[0-9A-Za-z\^_\+\-\*\/])|\b)(?:sin|cos|tan|cot|sec|csc|cosec)(?:\^[-+]?[0-9a-zA-Z\(\)]+)?(?:\([^\)]+\)|[0-9a-zA-Z_\\]+)/g,
    (match) => stash(renderAsciiMath(match, false)),
  );

  content = content.replace(
    /\b(?:root\([0-9a-zA-Z]+\)\([^\)]+\)|sqrt\([^\)]+\))/g,
    (match) => stash(renderAsciiMath(match, false)),
  );

  content = content.replace(
    /\b(?:d\^?[0-9]*[a-zA-Z]?\/d[a-zA-Z]\^?[0-9]*|\(d\^?[0-9]*[a-zA-Z]?\)\/\(d[a-zA-Z]\^?[0-9]*\))/g,
    (match) => stash(renderAsciiMath(match, false)),
  );

  content = content.replace(
    /\b(?:[0-9]+)?[A-Za-z][A-Za-z0-9_^\(\)]*(?:\s*[\+\-\*\/]\s*[0-9A-Za-z_^\(\)]+)+(?:\s*=\s*(?:[0-9A-Za-z_^\(\)\/\.]+|\?))?/g,
    (match) => stash(renderAsciiMath(match.trim(), false)),
  );

  content = content.replace(
    /\b(?:[0-9]+)?[A-Za-z]_[0-9A-Za-z\(\)]+(?:\^[0-9A-Za-z\(\)]+)?/g,
    (match) => stash(renderAsciiMath(match.trim(), false)),
  );

  content = content.replace(
    /\b[a-zA-Z](?:\([a-zA-Z0-9_\+\-\*\/]+\))?\s*=\s*[0-9a-zA-Z_^\-\+\*\/\(\)\|]+/g,
    (match) => stash(renderAsciiMath(match, false)),
  );

  content = content.replace(/\b[A-Za-z]\^[+-]?[0-9a-zA-Z\(\)]+/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );

  content = content.replace(/(?<=\s|^)([a-zA-Z])(?=\s*(?:এর|বা|ও|হলে))/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );

  // 1. Restore HTML tags
  content = content.replace(/@@HTML_TAG_(\d+)@@/g, (_, idx) => htmlTags[Number(idx)] ?? "");

  // 2. Restore KaTeX placeholders
  content = content.replace(/@@KATEX_(\d+)@@/g, (_, idx) => placeholders[Number(idx)] ?? "");

  return content;
}
