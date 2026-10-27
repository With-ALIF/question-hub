"use client";

import { useState } from "react";
import { HelpCircle, Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "item-1",
    question: "প্রশ্নব্যাংক-এ জয়েন করতে কি টাকা লাগে?",
    answer:
      "প্রশ্নব্যাংক-এ একাউন্ট তৈরী করা, বোর্ড পরীক্ষার প্রশ্ন ও সমাধান পড়া, টেস্ট পরীক্ষার প্রশ্ন ও সমাধান পড়া, ভর্তি পরীক্ষার প্রশ্ন দেখা, মূল বই সমূহের প্রশ্ন দেখা, যেকোনো প্রশ্ন সার্চ করা ও ফিল্টার করা সম্পূর্ণ ফ্রি!",
  },
  {
    id: "item-2",
    question: "প্রশ্নব্যাংক শিক্ষক না শিক্ষার্থীদের জন্য?",
    answer:
      "প্রশ্নব্যাংক শিক্ষক, শিক্ষার্থী, শিক্ষা প্রতিষ্ঠান ও অভিভাবক, সকলের জন্য। শিক্ষকেরা প্রশ্নব্যাংক ব্যবহার করে লেকচার প্রস্তুত করা, প্রশ্ন বা শীট তৈরী করা, শিক্ষার্থীদের পরীক্ষা নেয়া, ক্লাসে প্র্যাকটিস করানো ইত্যাদি কাজ করতে পারবেন。\n\nশিক্ষার্থীরা প্রশ্নব্যাংক ব্যবহার করে একাডেমিক ও সব ধরণের ভর্তি পরীক্ষার প্রস্তুতি নিতে পারবে। এবং অভিভাবকেরা শিক্ষার্থীদের পড়াতে, পড়াশুনা ট্র্যাক করতে এবং বাসায় পরীক্ষা নিতে ব্যবহার করতে পারবেন।",
  },
  {
    id: "item-3",
    question: "প্রশ্নব্যাংক-এ কি কি সার্ভিস আছে?",
    answer:
      "• মিনিটেই প্রশ্ন বা শীট তৈরীর সফটওয়্যার\n• বোর্ড পরীক্ষার প্রশ্নব্যাংক\n• ভর্তি পরীক্ষার প্রশ্নব্যাংক\n• মূল বই সমূহের সমাধান\n• টেস্ট পেপার\n• সকল গ্রুপের সকল বিষয়ের প্রশ্ন ও সমাধান",
  },
  {
    id: "item-4",
    question: "প্রশ্নব্যাংক কোন বিভাগের শিক্ষার্থীরা ব্যবহার করতে পারবে?",
    answer:
      "প্রশ্নব্যাংক সকল শ্রেণির সকল বিভাগ অর্থাৎ সাধারণ বিভাগ, বিজ্ঞান বিভাগ, মানবিক বিভাগ, ব্যবসায় শিক্ষা বিভাগের শিক্ষার্থীরা ব্যবহার করতে পারবে।",
  },
  {
    id: "item-5",
    question: "প্রশ্নব্যাংক-এ MCQ বা CQ প্রশ্নের সমাধান আছে?",
    answer:
      "প্রশ্নব্যাংক-এ MCQ, CQ, গাণিতিক সমস্যা, জ্ঞানমূলক, অনুধাবনমূলক প্রশ্ন ও সমাধান সহ সব ধরণের প্রশ্ন ও সমাধান আছে।",
  },
  {
    id: "item-6",
    question: "প্রশ্নব্যাংক ব্যবহার করে ভর্তি প্রস্তুতি নেয়া যাবে?",
    answer:
      "বোর্ড ও স্কুল/কলেজের টেস্ট পরীক্ষার প্রস্তুতির পাশাপাশি প্রশ্নব্যাংক-এ ভর্তি প্রস্তুতির জন্য ইঞ্জিনিয়ারিং, মেডিকেল, বিশ্ববিদ্যালয়, গুচ্ছ সহ সব ধরণের ভর্তি পরীক্ষার প্রশ্ন ও সমাধান আছে।",
  },
  {
    id: "item-7",
    question: "প্রশ্নব্যাংকে পরীক্ষা দেয়া বা নেয়া যাবে?",
    answer:
      "শীঘ্রই প্রশ্নব্যাংক-এ শিক্ষার্থীরা পরীক্ষা দিতে পারবে এবং শিক্ষকেরা প্রশ্নব্যাংক-তেই শিক্ষার্থীদের পরীক্ষা নিতে পারবেন।",
  },
  {
    id: "item-8",
    question: "প্রশ্নব্যাংক-এ মডেল টেস্ট দেয়া যাবে?",
    answer:
      "শীঘ্রই প্রশ্নব্যাংক-এ শিক্ষার্থীরা কোনো টপিক পড়া শেষে নিজেই নিজেকে যাচাই করতে ঐ টপিকের উপর পরীক্ষা তৈরী করে পরীক্ষা দিতে পারবে। প্রশ্নব্যাংক টিম কর্তৃক আয়োজিত বোর্ড ও সব ধরণের ভর্তি পরীক্ষার প্রস্তুতিমূলক ডেইলি টেস্ট ও মডেল টেস্ট পরীক্ষা গুলোতে অংশ নিতে পারবে।",
  },
  {
    id: "item-9",
    question: "প্রশ্ন কিভাবে তৈরী করবো?",
    answer:
      "ব্রাউজার থেকে আমাদের সাইটে গিয়ে খুব সহজেই প্রশ্ন বা শীট তৈরী করতে পারবেন。\n\nমাত্র ৩টি সহজ ধাপে যেকোনো প্রশ্ন বানান মিনিটেই:\n১। প্রশ্ন সিলেক্ট করুন\n২। পেইজ সেটিং করুন\n৩। ডাউনলোড বা প্রিন্ট করুন",
  },
  {
    id: "item-10",
    question: "প্রশ্ন তৈরীতে খরচ কত?",
    answer:
      "প্রশ্ন তৈরীর খরচ প্রশ্নের ধরণের উপর নির্ভর করে নির্ধারিত হয়। Pay As You Go সিস্টেমে আপনি প্রশ্ন বানালে পে করতে হবে, না বানালে কোনো ফি আসবে না, অর্থাৎ ফিক্সড কোনো ফি দিতে হয় না। উত্তরপত্র অটো তৈরী হয়, উত্তরপত্রের জন্য আলাদা পেমেন্ট করতে হয় না।",
  },
  {
    id: "item-11",
    question: "বর্তমানে কোনো অফার আছে?",
    answer:
      "নতুন একাউন্ট করলেই বিশেষ বোনাস পাবেন, সাথে প্রতি রেফারেল-এ আরও বোনাস যুক্ত হবে আপনার ওয়ালেটে।\n\nনতুন অফারের তথ্য পেতে ও নতুন ফিচার যুক্ত হলেই আমাদের নোটিফিকেশন ও আপডেটের মাধ্যমে জানতে পারবেন।",
  },
  {
    id: "item-12",
    question: "আমি প্রশ্নব্যাংক টিমে কিভাবে যুক্ত হতে পারি?",
    answer:
      "শিক্ষার্থীরা প্রশ্নব্যাংক টিমে ভলান্টিয়ার হিসেবে যুক্ত হতে পারবে, ক্যাম্পাস অ্যাম্বাসেডর হিসেবে যুক্ত হতে পারবে, সোশ্যাল মিডিয়া মডারেটর হিসেবে যুক্ত হতে পারবে। অন্য যেকোনো স্কিল রিলেটেড কাজেও যুক্ত হতে পারবে।\n\nশিক্ষকেরা প্রশ্নব্যাংক টিমে মেন্টর বা অ্যাম্বাসেডর হিসেবে যুক্ত হতে পারবেন।",
  },
  {
    id: "item-13",
    question: "প্রশ্নব্যাংক থেকে আয় করার কোনো উপায় আছে?",
    answer:
      "প্রশ্নব্যাংক টিমে একজন অ্যাফিলিয়েট মেম্বার হিসেবে যুক্ত হয়ে আয় করা যাবে।\nপ্রশ্ন তৈরী, সমাধান তৈরী, টাইপিং ইত্যাদি কাজের সাথে যুক্ত হয়ে আয় করা যাবে।\nঅনলাইনে বা অফলাইনে প্রশ্নব্যাংক-কে রেফার করে আয় করা যাবে।\n\nবিস্তারিত জানতে আমাদের কাস্টমার সার্ভিসে যোগাযোগ করুন অথবা ফেসবুক পেইজে ইনবক্স করুন।",
  },
  {
    id: "item-14",
    question: "আমি নতুন একাউন্ট তৈরী করতে পারছি না বা লগ-ইন করতে পারছি না, কি করবো?",
    answer:
      "আপনি আপনার ইমেইল ও পাসওয়ার্ড সঠিকভাবে ব্যবহার করেছেন কিনা, ভালো ভাবে যাচাই করুন। প্রয়োজনে কিছু সময় অপেক্ষা করে আবার চেষ্টা করুন। পাসওয়ার্ড ভুলে গেলে রিসেট অপশন থেকে পাসওয়ার্ড রিসেট করে নিন। এরপরেও যদি আপনি একাউন্ট তৈরী করতে না পারেন বা লগ-ইন করতে না পারেন তাহলে প্রশ্নব্যাংক সাপোর্টে যোগাযোগ করুন।",
  },
];

export function HomeFaqSection() {
  const [openItem, setOpenItem] = useState<string>("");
  const col1 = FAQ_ITEMS.slice(0, 7);
  const col2 = FAQ_ITEMS.slice(7);

  return (
    <section
      aria-labelledby="faq-heading"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20"
    >
      {/* Title & Badge */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 shadow-2xs">
          <HelpCircle className="size-3.5" />
          <span>সচরাচর জিজ্ঞাসা (FAQ)</span>
        </div>
        <h2
          id="faq-heading"
          className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2"
        >
          <span>কোন</span>
          <span className="text-primary relative inline-block underline decoration-primary/40 underline-offset-8">
            জিজ্ঞাসা?
          </span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          প্রশ্নব্যাংক প্ল্যাটফর্মের ব্যবহার, সুবিধা ও বিভিন্ন সেবা সম্পর্কিত সাধারণ প্রশ্নের উত্তর
        </p>
      </div>

      {/* Single Accordion coordinating both columns so only one item is open at a time */}
      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={(val) => setOpenItem(val || "")}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start"
      >
        {/* Column 1 */}
        <div className="space-y-3">
          {col1.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xs px-4 shadow-2xs transition-all hover:border-border hover:shadow-xs data-[state=open]:border-primary/40 data-[state=open]:bg-card"
            >
              <AccordionTrigger hideChevron className="py-4 text-left font-medium text-foreground hover:no-underline text-xs sm:text-sm leading-snug [&[data-state=open]>span>svg]:rotate-45">
                <span className="flex-1 pr-2">{item.question}</span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-200">
                  <Plus className="size-4 transition-transform duration-200" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border/40 mt-1 pt-3">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </div>

        {/* Column 2 */}
        <div className="space-y-3">
          {col2.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xs px-4 shadow-2xs transition-all hover:border-border hover:shadow-xs data-[state=open]:border-primary/40 data-[state=open]:bg-card"
            >
              <AccordionTrigger hideChevron className="py-4 text-left font-medium text-foreground hover:no-underline text-xs sm:text-sm leading-snug [&[data-state=open]>span>svg]:rotate-45">
                <span className="flex-1 pr-2">{item.question}</span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-200">
                  <Plus className="size-4 transition-transform duration-200" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border/40 mt-1 pt-3">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </div>
      </Accordion>
    </section>
  );
}
