import { localeForLanguage, type Language } from "./config";

type SubjectCopy = {
  name: string;
  tagline: string;
};

const SUBJECT_COPY: Record<string, { en: SubjectCopy; bn: SubjectCopy }> = {
  physics: {
    en: { name: "Physics", tagline: "Mechanics, waves, electricity & modern physics" },
    bn: { name: "পদার্থবিজ্ঞান", tagline: "বলবিদ্যা, তরঙ্গ, তড়িৎ ও আধুনিক পদার্থবিজ্ঞান" },
  },
  chemistry: {
    en: { name: "Chemistry", tagline: "Organic, inorganic & physical chemistry" },
    bn: { name: "রসায়ন", tagline: "জৈব, অজৈব ও ভৌত রসায়ন" },
  },
  biology: {
    en: { name: "Biology", tagline: "Cells, genetics, human physiology & environment" },
    bn: { name: "জীববিজ্ঞান", tagline: "কোষ, বংশগতিবিদ্যা, মানব শারীরতত্ত্ব ও পরিবেশ" },
  },
  mathematics: {
    en: { name: "Higher Mathematics", tagline: "Algebra, calculus, geometry & trigonometry" },
    bn: { name: "উচ্চতর গণিত", tagline: "বীজগণিত, ক্যালকুলাস, জ্যামিতি ও ত্রিকোণমিতি" },
  },
  ict: {
    en: { name: "ICT", tagline: "Computing, networking, databases & programming" },
    bn: { name: "আইসিটি", tagline: "কম্পিউটিং, নেটওয়ার্কিং, ডেটাবেস ও প্রোগ্রামিং" },
  },
  other: {
    en: { name: "Other Subjects", tagline: "English, Bangla, general knowledge & more" },
    bn: { name: "অন্যান্য বিষয়", tagline: "ইংরেজি, বাংলা, সাধারণ জ্ঞান ও অন্যান্য টপিক" },
  },
};

export type Translator = {
  lang: Language;
  /** English first, Bangla second. */
  tr: (en: string, bn: string) => string;
  /** Locale-aware number formatting. */
  num: (value: number | string) => string;
  subjectName: (slug: string, fallback?: string) => string;
  subjectTagline: (slug: string, fallback?: string) => string;
  filterLabel: (key: string) => string;
  typeLabel: (key: string) => string;
};

const FILTER_LABELS: Record<string, { en: string; bn: string }> = {
  db: { en: "Source DB", bn: "সোর্স ডেটাবেস" },
  un: { en: "University / Institute", bn: "বিশ্ববিদ্যালয় / প্রতিষ্ঠান" },
  year: { en: "Year", bn: "সাল" },
  paper: { en: "Paper", bn: "পত্র" },
  chapter: { en: "Chapter", bn: "অধ্যায়" },
  topic: { en: "Topic", bn: "টপিক" },
};

const TYPE_LABELS: Record<string, { en: string; bn: string }> = {
  all: { en: "All types", bn: "সব ধরন" },
  mcq: { en: "MCQ only", bn: "শুধু MCQ" },
  written: { en: "Written only", bn: "শুধু লিখিত" },
};

export function createTranslator(lang: Language): Translator {
  const isBangla = lang === "bn";
  const locale = localeForLanguage(lang);

  return {
    lang,
    tr: (en, bn) => (isBangla ? bn : en),
    num: (value) => {
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? parsed.toLocaleString(locale) : String(value);
    },
    subjectName: (slug, fallback) =>
      SUBJECT_COPY[slug]?.[isBangla ? "bn" : "en"].name ?? fallback ?? slug,
    subjectTagline: (slug, fallback) =>
      SUBJECT_COPY[slug]?.[isBangla ? "bn" : "en"].tagline ?? fallback ?? "",
    filterLabel: (key) => FILTER_LABELS[key]?.[isBangla ? "bn" : "en"] ?? key,
    typeLabel: (key) => TYPE_LABELS[key]?.[isBangla ? "bn" : "en"] ?? key,
  };
}
