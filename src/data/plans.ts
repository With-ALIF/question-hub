
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
      "All subjects included",
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
