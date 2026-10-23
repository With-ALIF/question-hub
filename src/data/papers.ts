export const SUBJECT_PAPER_NAMES: Record<string, string> = {
  "M-1": "উচ্চতর গণিত ১ম পত্র",
  "M-2": "উচ্চতর গণিত ২য় পত্র",
  "m-1": "উচ্চতর গণিত ১ম পত্র",
  "m-2": "উচ্চতর গণিত ২য় পত্র",
  "M": "উচ্চতর গণিত",
  "m": "উচ্চতর গণিত",

  "P-1": "পদার্থবিজ্ঞান ১ম পত্র",
  "P-2": "পদার্থবিজ্ঞান ২য় পত্র",
  "p-1": "পদার্থবিজ্ঞান ১ম পত্র",
  "p-2": "পদার্থবিজ্ঞান ২য় পত্র",
  "P": "পদার্থবিজ্ঞান",
  "p": "পদার্থবিজ্ঞান",

  "C-1": "রসায়ন ১ম পত্র",
  "C-2": "রসায়ন ২য় পত্র",
  "c-1": "রসায়ন ১ম পত্র",
  "c-2": "রসায়ন ২য় পত্র",
  "C": "রসায়ন",
  "c": "রসায়ন",

  "B-1": "জীববিজ্ঞান ১ম পত্র",
  "B-2": "জীববিজ্ঞান ২য় পত্র",
  "b-1": "জীববিজ্ঞান ১ম পত্র",
  "b-2": "জীববিজ্ঞান ২য় পত্র",
  "B": "জীববিজ্ঞান",
  "b": "জীববিজ্ঞান",

  "En-Tex": "ইংরেজি টেক্সট",
  "en-tex": "ইংরেজি টেক্সট",
  "En-Wri": "ইংরেজি রাইটিং",
  "en-wri": "ইংরেজি রাইটিং",
  "Eng-Grm": "ইংরেজি ব্যাকরণ",
  "en-grm": "ইংরেজি ব্যাকরণ",
  "Eng": "ইংরেজি",
  "eng": "ইংরেজি",
  "e": "ইংরেজি",

  "Ba-1": "বাংলা ১ম পত্র",
  "ba-1": "বাংলা ১ম পত্র",
  "Ba-2": "বাংলা ২য় পত্র",
  "ba-2": "বাংলা ২য় পত্র",
  "Ba": "বাংলা",
  "ba": "বাংলা",

  "ICT": "তথ্য ও যোগাযোগ প্রযুক্তি",
  "ict": "তথ্য ও যোগাযোগ প্রযুক্তি",
  "IQ": "আইকিউ",
  "iq": "আইকিউ",
  "GK-BD": "সাধারণ জ্ঞান (বাংলাদেশ)",
  "gk-bd": "সাধারণ জ্ঞান (বাংলাদেশ)",
  "GK-Int": "সাধারণ জ্ঞান (আন্তর্জাতিক)",
  "gk-int": "সাধারণ জ্ঞান (আন্তর্জাতিক)",
  "gk": "সাধারণ জ্ঞান",
  "GK": "সাধারণ জ্ঞান",
  "সাধারন গণিত": "সাধারণ গণিত",
  "সাধারন বিজ্ঞান": "সাধারণ বিজ্ঞান",
};

export function getPaperName(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  return (
    SUBJECT_PAPER_NAMES[trimmed] ??
    SUBJECT_PAPER_NAMES[trimmed.toUpperCase()] ??
    SUBJECT_PAPER_NAMES[trimmed.toLowerCase()] ??
    null
  );
}

export function formatPaperLabel(code: string | null | undefined): string {
  if (!code) return "";
  const trimmed = code.trim();
  const name = getPaperName(trimmed);
  return name ? `${trimmed}: ${name}` : trimmed;
}
