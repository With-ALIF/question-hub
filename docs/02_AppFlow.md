# 02_AppFlow.md: Application Flow & State Machine

## 1. Complete Navigation Map & Route Hierarchy

```
/ (Landing Page)
│
├── /login ─── [Auth Form / Google Sign In] ───► /dashboard
├── /register ─ [Account Creation] ───────────► /dashboard
├── /auth/callback ─ [OAuth Code Exchange] ────► /dashboard
│
├── /questions ── [Question Explorer]
│    ├── ?subject=[slug]
│    ├── ?type=[all|mcq|written]
│    ├── ?chapter=[name]&topic=[name]
│    └── ?q=[query]
│
├── /subjects ── [All Subjects Directory]
│    └── /subjects/[slug]
│
├── /saved ───── [User Saved Bookmarks] (Auth Required)
├── /dashboard ─ [User Profile, Stats, Active Plans] (Auth Required)
│
└── /admin ───── [Role: admin / moderator]
     ├── /admin/login ──── [Dedicated Admin Login]
     ├── /admin/dashboard ── [Global Metrics & System Health]
     ├── /admin/questions ── [Browse, Search, Edit, Delete, Duplicate Check]
     └── /admin/reports ──── [Review and Resolve User Question Reports]
```

---

## 2. Screen-by-Screen State Machine & Interaction Flows

### 2.1 Public Landing Page (`/`)
- **State: Initial Load**
  - Fetches manifest (`manifest.json`), total questions, subjects, and hero slides in parallel.
- **Components:**
  - Hero Slider with animated transition.
  - Quick Search & Subject Grid with live question counter badges.
  - Feature highlights & pricing plan breakdown.
  - 14-item Single-Collapsible FAQ Accordion (`HomeFaqSection`).
- **Transitions:**
  - Click on Subject Card ➔ `/questions?subject=[slug]`.
  - Click "Start Free" / "লগইন" ➔ `/login`.

### 2.2 Question Bank Explorer (`/questions`)
- **State Machine:**
  - `IDLE` ➔ `FETCHING_SHARD` ➔ `RENDER_SUCCESS` | `EMPTY_STATE` | `ERROR_STATE`.
- **Filters State:**
  - `subject` (physics, chemistry, math, biology, ict, etc.)
  - `type` ("all" | "mcq" | "written")
  - `chapter`, `topic`, `institution`, `year`
  - Pagination (`page`, `pageSize = 10`)
- **Card Actions:**
  - Toggle Explanation: Reveals KaTeX-rendered solution and discussion.
  - Save Question: Optimistically toggles bookmark status in Supabase `saved_questions`.
  - Report Question: Opens modal with issue categories (Wrong Answer, Typo, Formula error) and saves to `question_reports`.
- **Empty State:**
  - Displays icon, "কোনো প্রশ্ন পাওয়া যায়নি", and a "সব ফিল্টার রিসেট করুন" button.

### 2.3 Authentication Flow (`/login`, `/register`, `/auth/callback`)
- **Email / Password Flow:**
  - Client validates input (Zod schema) ➔ calls Supabase `signInWithPassword`.
  - On Success: Redirects to `/dashboard` (or `?next=` destination).
  - On Error: Displays localized Bengali error banner (e.g. "ইমেইল বা পাসওয়ার্ড সঠিক নয়").
- **Google OAuth Flow:**
  - Click "Google দিয়ে চালিয়ে যান" ➔ triggers `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`.
  - Redirects to Google consent screen ➔ returns to `https://question-hub-bd.vercel.app/auth/callback?code=...`.
  - Server Route Handler exchanges PKCE code for session cookies.
  - Seamlessly redirects to `/dashboard` with session established.

### 2.4 User Dashboard (`/dashboard`)
- **Auth Guard:**
  - Server Component calls `getCurrentUser()`. If null, redirects to `/login`.
  - Intercepts raw `?code=...` if received directly and forwards to `/auth/callback`.
- **Components:**
  - Welcome Banner with user full name / avatar.
  - Plan Status pill (Free / Pro / Premium).
  - Saved Questions quick access.
  - Subject Mastery / Quick links to continue practice.
  - Sign Out button calling `signOutAction()`.

### 2.5 Admin Question Management (`/admin/questions`)
- **Role Guard:**
  - Checks user role in `profiles` / `getCurrentRole()`. If not admin, redirects to `/admin/login`.
- **Actions:**
  - **Live Search:** Fast query with cached indexed shards.
  - **Duplicate Detection:** Automatic badge highlighting identical question texts across the view.
  - **Edit Modal:** Form to edit question text, options, correct answer, and explanation with instant KaTeX preview.
  - **Instant Deletion Flow:**
    - Confirmation modal opens ➔ Admin confirms deletion.
    - Card vanishes in 0ms; Total, Subject, and Type counts decrement in 0ms (optimistic).
    - Concurrently updates main storage shard, type shard, database table, and `manifest.json`.
    - Memory caches invalidated and Next.js paths revalidated in background (< 1s).
