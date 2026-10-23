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
  s = s.replace(/\u0251/g, "alpha");
  s = s.replace(/α/g, "alpha");
  s = s.replace(/β/g, "beta");
  s = s.replace(/γ/g, "gamma");
  s = s.replace(/δ/g, "delta");
  s = s.replace(/θ/g, "theta");
  s = s.replace(/λ/g, "lambda");
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

  if (/^(?:[-+]?\d*\/?\d*)?\[\[[\s\S]*\]\]$/.test(trimmed)) return true;
  if (/^(?:[-+]?\d*\/?\d*)?\[\([\s\S]*\)\]$/.test(trimmed)) return true;
  if (/^\|[\s\S]*\|(?:=\d+)?$/.test(trimmed)) return true;

  if (/^(?:[-+]?\d*\/?\d*)?\[[\s\S]*\](?:\^[-+]?[0-9a-zA-Z\(\)]+)?$/.test(trimmed)) return true;

  if (/[\[\]\(\)\{\}\^_\+\*\/\=\<\>\|\\~%]/.test(trimmed)) return true;

  if (
    /\b(?:sin|cos|tan|cot|sec|csc|cosec|ln|log|lim|int|sqrt|root|pi|alpha|beta|theta|hati|hatj|hatk)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  if (/^[-+]?[0-9a-zA-Z]+(?:\/[0-9a-zA-Z]+)?$/.test(trimmed)) return true;

  return false;
}

export function renderMathInContent(raw: string | null | undefined): string {
  if (!raw) return "";
  let content = String(raw).trim();

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
      const clean = inner.replace(/<[^>]*>/g, "").trim();
      if (!clean) return "";
      const isDisplay = tag.toLowerCase() === "p" || tag.toLowerCase() === "div";
      return stash(renderAsciiMath(clean, isDisplay));
    },
  );

  content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => stash(renderLatex(math, true)));
  content = content.replace(/\\\[([\s\S]+?)\\\]/g, (_match, math) => stash(renderLatex(math, true)));

  content = content.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (_match, math) =>
    stash(renderLatex(math, false)),
  );
  content = content.replace(/\\\(([\s\S]+?)\\\)/g, (_match, math) =>
    stash(renderLatex(math, false)),
  );

  content = content.replace(/(?:[-+]?\d*\/?\d*)?\[\[[\s\S]*?\]\]/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );
  content = content.replace(/(?:[-+]?\d*\/?\d*)?\[\([\s\S]*?\)\]/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );
  content = content.replace(/\|\([\s\S]*?\)[\s\S]*?\|(?:=[0-9a-zA-Z]+)?/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );

  content = content.replace(
    /(?:[-+]?\d*\/?\d*)?\[[0-9a-zA-Z_^\-\+\*\/\(\)\|\<\>\=\,\.\s]+\](?:\^[0-9a-zA-Z\(\)]+)?/g,
    (match) => stash(renderAsciiMath(match, false)),
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
    /\b[a-zA-Z](?:\([a-zA-Z0-9_\+\-\*\/]+\))?\s*=\s*[0-9a-zA-Z_^\-\+\*\/\(\)\|]+/g,
    (match) => stash(renderAsciiMath(match, false)),
  );

  content = content.replace(/\b[A-Za-z]\^[+-]?[0-9a-zA-Z\(\)]+/g, (match) =>
    stash(renderAsciiMath(match, false)),
  );

  content = content.replace(/@@KATEX_(\d+)@@/g, (_, idx) => placeholders[Number(idx)] ?? "");

  return content;
}
