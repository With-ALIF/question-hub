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
      text("Access 100 free questions", "১০০টি ফ্রি প্রশ্নে অ্যাক্সেস"),
      text("1 subject of your choice", "আপনার পছন্দের ১টি বিষয়"),
      text("Community answers only", "শুধু কমিউনিটি উত্তর"),
      text("Basic search", "বেসিক সার্চ"),
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
      text("Unlimited question access", "আনলিমিটেড প্রশ্ন অ্যাক্সেস"),
      text("All subjects included", "সব বিষয় অন্তর্ভুক্ত"),
      text("Expert-verified solutions", "বিশেষজ্ঞ-যাচাইকৃত সমাধান"),
      text("Chapter-wise practice sets", "অধ্যায়ভিত্তিক প্র্যাকটিস সেট"),
      text("Priority support", "প্রায়োরিটি সাপোর্ট"),
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
      text("Everything in Scholar", "Scholar-এর সবকিছু"),
      text("Previous years' question papers", "বিগত বছরের প্রশ্নপত্র"),
      text("Downloadable PDF notes", "ডাউনলোডযোগ্য PDF নোট"),
      text("Mock exam generator", "মক পরীক্ষা জেনারেটর"),
      text("Early access to new chapters", "নতুন অধ্যায়ে আগাম অ্যাক্সেস"),
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
      text("Access 100 free questions", "১০০টি ফ্রি প্রশ্নে অ্যাক্সেস"),
      text("Build 2 exam papers per month", "মাসে ২টি পরীক্ষাপত্র তৈরি"),
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
      text("Unlimited question access", "আনলিমিটেড প্রশ্ন অ্যাক্সেস"),
      text("Unlimited exam paper builder", "আনলিমিটেড পরীক্ষাপত্র বিল্ডার"),
      text("PDF export with answer keys", "উত্তরপত্রসহ PDF এক্সপোর্ট"),
      text("Save unlimited questions", "আনলিমিটেড প্রশ্ন সেভ"),
      text("Priority support", "প্রায়োরিটি সাপোর্ট"),
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
      text("Everything in Teacher Pro", "Teacher Pro-এর সবকিছু"),
      text("Up to 10 teacher accounts", "সর্বোচ্চ ১০টি শিক্ষক অ্যাকাউন্ট"),
      text("Shared question collections", "শেয়ার করা প্রশ্ন সংগ্রহ"),
      text("Student progress reports", "শিক্ষার্থীর অগ্রগতির রিপোর্ট"),
      text("Dedicated onboarding", "ডেডিকেটেড অনবোর্ডিং"),
    ],
    highlighted: false,
    cta: text("Subscribe Now", "এখনই সাবস্ক্রাইব"),
  },
];

export const plansByAudience: Record<PlanAudience, Plan[]> = {
  student: studentPlans,
  teacher: teacherPlans,
};
