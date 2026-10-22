export type SubjectAccent = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";

export type Subject = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  icon: "atom" | "flask" | "dna" | "sigma" | "monitor";
  chapters: string[];
  questionCount: number;
  accent: SubjectAccent;
};

export const subjects: Subject[] = [
  {
    id: "physics",
    slug: "physics",
    name: "Physics",
    tagline: "Mechanics, waves, electricity & modern physics",
    icon: "atom",
    chapters: ["Motion & Force", "Work & Energy", "Waves & Sound", "Current Electricity", "Modern Physics"],
    questionCount: 18400,
    accent: "chart-1",
  },
  {
    id: "chemistry",
    slug: "chemistry",
    name: "Chemistry",
    tagline: "Organic, inorganic & physical chemistry",
    icon: "flask",
    chapters: ["Atomic Structure", "Periodic Table", "Chemical Bonding", "Organic Chemistry", "Electrochemistry"],
    questionCount: 1520,
    accent: "chart-2",
  },
  {
    id: "biology",
    slug: "biology",
    name: "Biology",
    tagline: "Cells, genetics, human physiology & ecology",
    icon: "dna",
    chapters: ["Cell & Cell Division", "Genetics", "Human Physiology", "Plant Physiology", "Ecology"],
    questionCount: 2110,
    accent: "chart-3",
  },
  {
    id: "mathematics",
    slug: "mathematics",
    name: "Mathematics",
    tagline: "Algebra, calculus, geometry & trigonometry",
    icon: "sigma",
    chapters: ["Sets & Functions", "Algebra", "Trigonometry", "Calculus", "Statistics"],
    questionCount: 2460,
    accent: "chart-4",
  },
  {
    id: "ict",
    slug: "ict",
    name: "ICT",
    tagline: "Computing, networking, databases & programming",
    icon: "monitor",
    chapters: ["Global Village", "Communication Systems", "Networking", "Programming Basics", "Database"],
    questionCount: 980,
    accent: "chart-5",
  },
];

export type PopularQuestion = {
  id: string;
  text: string;
  subjectSlug: string;
  subjectName: string;
  chapter: string;
  views: string;
  likes: number;
};

export const popularQuestions: PopularQuestion[] = [
  {
    id: "q-101",
    text: "A body moves with uniform acceleration. Derive the three equations of motion.",
    subjectSlug: "physics",
    subjectName: "Physics",
    chapter: "Motion & Force",
    views: "12.4k",
    likes: 860,
  },
  {
    id: "q-102",
    text: "Explain Markovnikov's rule with examples of addition reactions.",
    subjectSlug: "chemistry",
    subjectName: "Chemistry",
    chapter: "Organic Chemistry",
    views: "10.1k",
    likes: 742,
  },
  {
    id: "q-103",
    text: "Describe the structure of DNA and the process of replication.",
    subjectSlug: "biology",
    subjectName: "Biology",
    chapter: "Genetics",
    views: "9.7k",
    likes: 690,
  },
  {
    id: "q-104",
    text: "Find the derivative of sin x from first principles.",
    subjectSlug: "mathematics",
    subjectName: "Mathematics",
    chapter: "Calculus",
    views: "8.9k",
    likes: 615,
  },
  {
    id: "q-105",
    text: "What are the differences between LAN, MAN and WAN?",
    subjectSlug: "ict",
    subjectName: "ICT",
    chapter: "Networking",
    views: "7.2k",
    likes: 540,
  },
  {
    id: "q-106",
    text: "State Newton's third law with a real-life example.",
    subjectSlug: "physics",
    subjectName: "Physics",
    chapter: "Motion & Force",
    views: "6.8k",
    likes: 498,
  },
];

export type Plan = {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  duration: string;
  features: string[];
  highlighted: boolean;
  cta: string;
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Starter",
    price: "৳0",
    priceNote: "forever free",
    duration: "No expiry",
    features: [
      "Access 100 free questions",
      "1 subject of your choice",
      "Community answers only",
      "Basic search",
    ],
    highlighted: false,
    cta: "Start Free",
  },
  {
    id: "monthly",
    name: "Scholar",
    price: "৳199",
    priceNote: "per month",
    duration: "1 month",
    features: [
      "Unlimited question access",
      "All 5 subjects included",
      "Expert-verified solutions",
      "Chapter-wise practice sets",
      "Priority support",
    ],
    highlighted: true,
    cta: "Subscribe Now",
  },
  {
    id: "yearly",
    name: "Topper",
    price: "৳1,499",
    priceNote: "per year — save 37%",
    duration: "12 months",
    features: [
      "Everything in Scholar",
      "Previous years' question papers",
      "Downloadable PDF notes",
      "Mock exam generator",
      "Early access to new chapters",
    ],
    highlighted: false,
    cta: "Go Yearly",
  },
];

/* ---------- Static demo data for the not-yet-connected user dashboard ---------- */

export const userSummary = {
  name: "Rafi Ahmed",
  email: "rafi.ahmed@example.com",
  plan: "Scholar",
  planDuration: "1 month",
  renewsOn: "Nov 18, 2026",
  solvedCount: 312,
  bookmarked: 47,
  streak: 12,
};

export const userRecentActivity = [
  { id: "1", text: "Solved: Derive the three equations of motion.", subject: "Physics", time: "2 hours ago" },
  { id: "2", text: "Bookmarked: Markovnikov's rule examples.", subject: "Chemistry", time: "Yesterday" },
  { id: "3", text: "Solved: Structure of DNA & replication.", subject: "Biology", time: "2 days ago" },
  { id: "4", text: "Solved: Derivative of sin x from first principles.", subject: "Mathematics", time: "3 days ago" },
];
