export type LocalizedText = {
  en: string;
  bn: string;
};

export type PlanAudience = "student" | "teacher";

export type Plan = {
  id: string;
  name: LocalizedText;
  price: string;
  /** Numeric price in BDT. Always charged from this server-side value, never from the URL/UI. */
  amountBdt: number;
  /** Access length in days. */
  durationDays: number;
  priceNote: LocalizedText;
  duration: LocalizedText;
  features: LocalizedText[];
  highlighted: boolean;
  badge?: LocalizedText;
  cta: LocalizedText;
};

const text = (en: string, bn: string): LocalizedText => ({ en, bn });

export const studentPlans: Plan[] = [
  {
    id: "student-free",
    name: text("Starter", "Starter"),
    price: "৳0",
    amountBdt: 0,
    durationDays: 0,
    priceNote: text("forever free", "চিরকাল ফ্রি"),
    duration: text("No expiry", "মেয়াদ নেই"),
    features: [
      text("All MCQs in your chosen subject", "নির্বাচিত বিষয়ের সব MCQ"),
      text("1 subject of your choice", "আপনার পছন্দের ১টি বিষয়"),
      text("1 model test total", "মোট ১টি মডেল টেস্ট"),
      text("No daily MCQ limit", "দৈনিক MCQ সীমা নেই"),
      text("Community answers only", "শুধু কমিউনিটি উত্তর"),
    ],
    highlighted: false,
    cta: text("Start Free", "ফ্রি শুরু করুন"),
  },
  {
    id: "student-monthly",
    name: text("Scholar", "Scholar"),
    price: "৳199",
    amountBdt: 199,
    durationDays: 30,
    priceNote: text("per month", "প্রতি মাসে"),
    duration: text("1 month", "১ মাস"),
    features: [
      text("Choose 1 database (HSC, Admission or Job)", "১টি ডেটাবেস বেছে নিন (HSC, Admission বা Job)"),
      text("All subjects & chapters in that database", "সেই ডেটাবেসের সব বিষয় ও অধ্যায়"),
      text("Unlimited MCQs", "আনলিমিটেড MCQ"),
      text("Model tests (plan limit)", "মডেল টেস্ট (প্ল্যান সীমা অনুযায়ী)"),
      text("Expert-verified solutions", "বিশেষজ্ঞ-যাচাইকৃত সমাধান"),
    ],
    highlighted: true,
    badge: text("Most popular", "সর্বাধিক জনপ্রিয়"),
    cta: text("Subscribe Now", "এখনই সাবস্ক্রাইব"),
  },
  {
    id: "student-yearly",
    name: text("Topper", "Topper"),
    price: "৳1,499",
    amountBdt: 1499,
    durationDays: 365,
    priceNote: text("per year — save 37%", "প্রতি বছর — ৩৭% সাশ্রয়"),
    duration: text("12 months", "১২ মাস"),
    features: [
      text("Choose 1 database (HSC or Admission)", "১টি ডেটাবেস বেছে নিন (HSC বা Admission)"),
      text("All subjects & chapters in that database", "সেই ডেটাবেসের সব বিষয় ও অধ্যায়"),
      text("Unlimited MCQs and model tests", "আনলিমিটেড MCQ ও মডেল টেস্ট"),
      text("Previous years' question papers", "বিগত বছরের প্রশ্নপত্র"),
      text("365 days of access", "৩৬৫ দিনের অ্যাক্সেস"),
    ],
    highlighted: false,
    cta: text("Go Yearly", "ইয়ারলি নিন"),
  },
];

export const teacherPlans: Plan[] = [
  {
    id: "teacher-free",
    name: text("Educator", "Educator"),
    price: "৳0",
    amountBdt: 0,
    durationDays: 0,
    priceNote: text("forever free", "চিরকাল ফ্রি"),
    duration: text("No expiry", "মেয়াদ নেই"),
    features: [
      text("1 exam paper total", "মোট ১টি পরীক্ষাপত্র"),
      text("Select questions from your approved access", "অনুমোদিত অ্যাক্সেস থেকে প্রশ্ন নির্বাচন"),
      text("Save up to 50 questions", "৫০টি পর্যন্ত প্রশ্ন সেভ"),
      text("Community support", "কমিউনিটি সাপোর্ট"),
    ],
    highlighted: false,
    cta: text("Start Free", "ফ্রি শুরু করুন"),
  },
  {
    id: "teacher-monthly",
    name: text("Teacher Pro", "Teacher Pro"),
    price: "৳299",
    amountBdt: 299,
    durationDays: 30,
    priceNote: text("per month", "প্রতি মাসে"),
    duration: text("1 month", "১ মাস"),
    features: [
      text("All subjects and databases", "সব বিষয় ও ডেটাবেস"),
      text("Unlimited MCQ access", "আনলিমিটেড MCQ অ্যাক্সেস"),
      text("Model tests and exam paper builder", "মডেল টেস্ট ও পরীক্ষাপত্র বিল্ডার"),
      text("Questions and explanations", "প্রশ্ন ও ব্যাখ্যা"),
      text("30 days of access", "৩০ দিনের অ্যাক্সেস"),
    ],
    highlighted: true,
    badge: text("Best for teachers", "শিক্ষকদের জন্য সেরা"),
    cta: text("Subscribe Now", "এখনই সাবস্ক্রাইব"),
  },
  {
    id: "teacher-yearly",
    name: text("Institution", "Institution"),
    price: "৳2,499",
    amountBdt: 2499,
    durationDays: 365,
    priceNote: text("per year — save 30%", "প্রতি বছর — ৩০% সাশ্রয়"),
    duration: text("12 months", "১২ মাস"),
    features: [
      text("All subjects and databases", "সব বিষয় ও ডেটাবেস"),
      text("Unlimited MCQs and model tests", "আনলিমিটেড MCQ ও মডেল টেস্ট"),
      text("Exam paper builder", "পরীক্ষাপত্র বিল্ডার"),
      text("Questions, answers and explanations", "প্রশ্ন, উত্তর ও ব্যাখ্যা"),
      text("365 days of access", "৩৬৫ দিনের অ্যাক্সেস"),
    ],
    highlighted: false,
    cta: text("Subscribe Now", "এখনই সাবস্ক্রাইব"),
  },
];

export const plansByAudience: Record<PlanAudience, Plan[]> = {
  student: studentPlans,
  teacher: teacherPlans,
};
