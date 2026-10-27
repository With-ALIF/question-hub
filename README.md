# QuestionBank (প্রশ্নব্যাংক) — Academic & Admission Question Hub

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Storage%20%7C%20Database-3ecf8e?logo=supabase)](https://supabase.com/)
[![KaTeX](https://img.shields.io/badge/KaTeX-LaTeX%20%26%20Formula-brightgreen)](https://katex.org/)

**QuestionBank (প্রশ্নব্যাংক)** is a high-performance, production-ready educational platform and academic question repository built for Bangladeshi students, educators, academic institutions, and administrators.

The platform hosts tens of thousands of curated questions across **Board Exams (HSC, SSC)**, **College Test Papers**, and **Competitive Admission Tests** (BUET/Engineering, Medical/Dental, Dhaka University, and GST Unified Admission), powered by a scalable **Sharded Storage Engine**, **KaTeX Scientific Formula Rendering**, and an automated **4-Set Exam Paper & PDF Builder**.

---

## 🌟 Key Highlights & Features

### 1. 🔍 Fast Question Explorer & Multi-Faceted Filters

- **Faceted Filtering:** Instant query filtering by **Subject**, **Paper (1st / 2nd)**, **Chapter**, **Topic**, **Institution / Board / University**, **Year**, and **Question Type** (MCQ vs. Written).
- **Explanation Toggles:** Step-by-step verified solutions and analytical explanations for every question.
- **Has/No Explanation Filters:** Quickly narrow down questions that need study assistance or review.
- **Bengali & English UI:** Fully localized bilingual interface with native number mapping and language toggle.

### 2. ➗ Scientific & Chemical Formula Engine (KaTeX + AsciiMath)

- **High-Precision Rendering:** Seamless formatting of complex mathematical equations, physics notations, chemical reaction balances, sub/superscripts, fractions, and matrices using `katex` and `asciimath-to-latex`.
- **Bengali Numeral Normalization:** Auto-translates Bengali numerals (`১, ২, ৩`) in math formulas to standard digits for reliable rendering.
- **Diagram Lightbox:** Click-to-enlarge responsive image viewer for biological diagrams, electrical circuits, and geometrical figures.
- **Zero-Crash Fallback:** Graceful fallback to raw text if syntax errors occur.

### 3. 📄 Automated Exam Paper & Solution PDF Generator

- **Question Selection Cart:** Pick questions across chapters and subjects to build custom tests in minutes.
- **4-Set Generator (Set A, B, C, D):** Automatically shuffles questions and MCQ options to prevent exam cheating.
- **10-Column OMR / Answer Grid:** Auto-generates compact answer tables for rapid student scoring.
- **Complete Answer Key Sheet:** Appends full step-by-step explanations at the end of the question paper.
- **Customizable Exam Branding:** Configurable Institute Name, Exam Title, Tutor Name, Time Limit, Total Marks, Instructions, and Watermark.
- **Clean PDF & Print Engine:** High-fidelity 1-column or 2-column printable output powered by `html2pdf.js` with embedded KaTeX CSS.

### 4. 🔖 Student Dashboard & Bookmarking

- **One-Click Bookmarks:** Optimistic bookmarking (`/saved`) to save tough questions for personal revision.
- **Profile & Plan Center:** Overview of user account tier (Free, Pro, Premium) and mastery links.
- **Model Test (`/model-test`):** Timed mock tests with countdown timers, negative marking, and performance analytics.

### 5. 🛡️ Comprehensive Admin & Moderation Suite (`/admin/*`)

- **System Overview (`/admin/dashboard`):** Real-time analytics on total questions, subject distribution, active storage shards, and pending reports.
- **Question Manager (`/admin/questions`):** Sub-second search across 50,000+ questions by keyword or ID, duplicate question detection badges, and rich KaTeX modal editing.
- **Instant Optimistic Deletion:** 0ms instant UI removal with background sync across main storage shards, type shards, database backup tables, and `manifest.json`.
- **Report Resolution Panel (`/admin/reports`):** Review user-submitted error reports, preview affected questions, update question data, and resolve/reject issues.
- **Hero Slider Manager (`/admin/home-slider`):** Update and reorder promotional banners on the homepage.

### 6. 🚨 Multi-Channel Error & Feedback Alerts

- Student reporting modal on every question card for wrong answers, typos, missing explanations, or LaTeX formatting errors.
- Instant notifications sent to administrators via **Resend Email** and **Telegram Bot** (`grammy`).

---

## 🏗️ Technical Architecture

### Tech Stack Overview

| Layer                  | Technology                                          | Description                                                         |
| :--------------------- | :-------------------------------------------------- | :------------------------------------------------------------------ |
| **Framework**          | **Next.js 16.4** (App Router)                       | React Server Components (RSC), Server Actions, Turbopack            |
| **Runtime & Language** | **Node.js 20+** & **TypeScript 5.8**                | Strict TypeScript mode with zero `any` allowance                    |
| **UI & Styling**       | **Tailwind CSS v4**, **Radix UI**, **Lucide Icons** | Design tokens via CSS variables, dark/light theme parity            |
| **Math & Science**     | **KaTeX 0.19**, **AsciiMath**                       | In-browser formula parsing, sanitization, and glyph rendering       |
| **Storage & Database** | **Supabase**                                        | Sharded JSON bucket storage, PostgreSQL, Row-Level Security         |
| **Auth & RBAC**        | **Supabase SSR**                                    | Cookie-based session auth, Google OAuth (PKCE), Role access control |
| **PDF Generation**     | **html2pdf.js 0.14**                                | Client-side vector-accurate printable exam sheets                   |
| **Notifications**      | **Resend** & **Telegram Bot API**                   | Automated error report alerts to moderation teams                   |

### ⚡ High-Throughput Sharded Storage Architecture

To eliminate expensive SQL query bottlenecks across 50,000+ rich questions with HTML and math expressions, QuestionBank utilizes a **Sharded Storage Engine** hosted on Supabase Storage (`qb-raw` / `questions-v2`):

```
Supabase Storage (Bucket: qb-raw / questions-v2)
├── manifest.json                  # Global index (total counts, subject counts, shard counts)
│
├── physics/
│   ├── shard-0001.json            # 100 questions per shard
│   ├── shard-0002.json
│   ├── mcq/shard-0001.json        # Pre-filtered MCQ shards for rapid pagination
│   └── written/shard-0001.json    # Pre-filtered Written shards
│
├── chemistry/
│   └── ...
```

- **In-Memory LRU Shard Caching:** Server instances cache up to 500 active shards in memory with automated invalidation when admin updates or deletions occur.
- **Sub-200ms Latency:** Shard fetching and manifest caching guarantee fast response times without high database load.

---

## 📁 Repository Directory Structure

```
question-hub/
├── app/                              # Next.js App Router (RSC & Routes)
│   ├── layout.tsx                    # Root layout with bilingual & theme providers
│   ├── page.tsx                      # Landing page with hero slider, subjects & FAQ
│   ├── admin/                        # Protected Admin routes (RBAC Guard)
│   │   ├── dashboard/                # Platform metrics & health
│   │   ├── questions/                # High-speed question browser, search & editor
│   │   ├── reports/                  # User problem reports review & resolver
│   │   ├── home-slider/              # Homepage banner carousel management
│   │   └── login/                    # Dedicated Admin authentication
│   ├── auth/callback/route.ts        # PKCE OAuth token exchange Route Handler
│   ├── dashboard/                    # Student/teacher personalized dashboard
│   ├── exam-paper/                   # Custom Exam Paper Builder view
│   ├── model-test/                   # Timed practice tests & mock exams
│   ├── plans/                        # Subscription tiers comparison
│   ├── questions/                    # Public Question Explorer with faceted filters
│   ├── saved/                        # Student bookmarked questions
│   ├── subjects/                     # Subject catalog & chapter navigator
│   ├── login/ & register/            # Public Auth pages
│   └── globals.css                   # Tailwind v4 styles, HSL theme tokens & fonts
│
├── src/
│   ├── components/
│   │   ├── admin/                    # Admin cards, deletion/edit modals, sidebar
│   │   ├── auth/                     # GoogleSignInButton, LoginForm, RegisterForm
│   │   ├── exam-paper/               # ExamPaperBuilderView, ExamPaperPdfModal
│   │   ├── questions/                # QuestionCard, QuestionFiltersForm, MultiSelects
│   │   ├── report/                   # ReportButton, ReportModal
│   │   ├── saved/                    # SavedQuestionsView
│   │   ├── site/                     # Navbar, Footer, HeroCarousel, HomeFaqSection
│   │   └── ui/                       # Radix UI primitives (Accordion, Dialog, Tabs, etc.)
│   │
│   ├── lib/
│   │   ├── admin/                    # Admin search indexer, question deletion/edit actions
│   │   ├── auth/                     # Session helpers, roles, server actions
│   │   ├── exam-paper/               # Print engine, 4-set generator, KaTeX CSS
│   │   ├── i18n/                     # Bilingual client/server localization helpers
│   │   ├── math.ts                   # KaTeX & AsciiMath parser, sanitizer, digit converter
│   │   ├── questions/                # storage.ts (Sharded Storage engine), filters.ts
│   │   ├── reports/                  # Report actions, Resend email & Telegram dispatcher
│   │   └── supabase/                 # Client, server, and service-role admin factories
│   │
│   └── data/                         # Subjects, chapters, papers & plans data
│
├── docs/                             # Full architectural specification documents
│   ├── 01_PRD.md                     # Product Requirements Document
│   ├── 02_AppFlow.md                 # State machines & route flows
│   ├── 03_UI_Spec.md                 # Design system, HSL tokens & typography
│   ├── 04_TRD.md                     # Technical Requirements & tech stack lock
│   ├── 05_Schema.md                  # Database DDL, tables & RLS security policies
│   └── 06_Plan.md                    # Roadmap & execution checklist
│
├── proxy.ts                          # Next.js Supabase session refresher
└── package.json                      # Project dependencies & scripts
```

---

## 🗄️ Database & Security (RLS)

The platform uses Supabase with PostgreSQL. Complete schemas and DDL scripts are documented in [`docs/05_Schema.md`](file:///c:/Users/ALIF/OneDrive/Desktop/New%20folder/question-hub/docs/05_Schema.md).

### Main Tables:

- `public.profiles`: User metadata, assigned role (`user`, `teacher`, `moderator`, `admin`), and active subscription plan.
- `public.saved_questions`: User bookmarks with unique `(user_id, question_id)` constraints.
- `public.question_reports`: Student feedback on question accuracy with status workflows (`pending`, `reviewed`, `resolved`, `rejected`).
- `public.qb_subjects`: Catalog of active subjects, icons, accents, and sort orders.
- `public.qb_features`: Feature flags and modular toggles.

### Security Highlights:

- **Row-Level Security (RLS):** Enabled on all tables. Users can only read and mutate their own saved questions and reports.
- **Service Role Isolation:** `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-side action handlers in `src/lib/supabase/admin.ts`.
- **Role Guards:** Admin pages strictly verify role permissions before rendering components.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** `>= 20.x` (Recommended: `v20.x` or `v22.x`)
- **Package Manager:** `npm` (or `pnpm`)
- **Supabase Project:** Supabase project with Storage bucket `qb-raw` and configured database tables.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/With-ALIF/question-hub.git
cd question-hub
npm install
```

### 2. Environment Variables Configuration

Create a `.env.local` file in the root directory (referencing `.env`):

```env
# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Server-Only Secret (Required for Admin actions & Sharded Storage Sync)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Storage Buckets & Prefixes (Defaults: qb-raw / questions-v2)
SUPABASE_QUESTIONS_BUCKET=qb-raw
SUPABASE_QUESTIONS_PREFIX=questions-v2

# Error Reporting Alerts (Optional)
RESEND_API_KEY=your-resend-api-key
ADMIN_NOTIFICATION_EMAIL=admin@example.com
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Available Scripts

| Command             | Action                                                                |
| :------------------ | :-------------------------------------------------------------------- |
| `npm run dev`       | Starts Next.js development server with Turbopack                      |
| `npm run build`     | Builds optimized production bundle                                    |
| `npm run start`     | Starts Next.js production server                                      |
| `npm run typecheck` | Validates TypeScript types across the entire project (`tsc --noEmit`) |
| `npm run lint`      | Runs ESLint analysis for code quality                                 |
| `npm run format`    | Formats all files using Prettier                                      |

---

## 🌐 Routes Overview

| Route                  | Access        | Description                                                      |
| :--------------------- | :------------ | :--------------------------------------------------------------- |
| `/`                    | Public        | Homepage featuring Hero Slider, Subject Grid, Live Counter, FAQ  |
| `/questions`           | Public        | Question Explorer with multi-faceted filtering & KaTeX solutions |
| `/subjects`            | Public        | Complete Subject directory & chapter breakdown                   |
| `/plans`               | Public        | Student and Teacher subscription tiers comparison                |
| `/exam-paper`          | Auth Required | Custom 4-Set Exam Paper & Solution PDF Generator                 |
| `/model-test`          | Public / User | Timed practice tests & mock examinations                         |
| `/saved`               | Auth Required | User's bookmarked questions for personal review                  |
| `/dashboard`           | Auth Required | User profile, active plan, and study statistics                  |
| `/login` & `/register` | Public        | User authentication with Email/Password and Google OAuth         |
| `/admin/login`         | Public        | Dedicated administrative login portal                            |
| `/admin/dashboard`     | Admin Only    | System health, metrics, shard status, and report queues          |
| `/admin/questions`     | Admin Only    | High-speed question search, edit modal, and instant deletion     |
| `/admin/reports`       | Admin Only    | User error report review, question preview, and resolution       |
| `/admin/home-slider`   | Admin Only    | Homepage carousel slides management                              |

---

## 📄 License

This project is proprietary and developed for **QuestionBank (প্রশ্নব্যাংক)**. All rights reserved.
