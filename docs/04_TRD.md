# 04_TRD.md: Technical Requirements Document (TRD)

## 1. Locked Core Tech Stack & Dependency Versions

### Core Architecture
- **Framework:** Next.js `16.4.2` / `16.4.3` (App Router, Turbopack, React Server Components)
- **Runtime:** Node.js `>= 20.x` (Tested on Node.js `v24.18.0`)
- **Language:** TypeScript `^5.x` (Strict mode enabled, zero `any` allowance)
- **UI & Component Layer:** React `19.2.0`, Radix UI Primitives (`@radix-ui/react-*`), Lucide Icons (`^0.575.0`)
- **Styling:** Tailwind CSS with CSS Variables & Vanilla utilities
- **Formula & Rendering:** KaTeX `^0.19.0`, AsciiMath-to-LaTeX `^0.5.1`
- **Backend & Auth:** Supabase (`@supabase/ssr` `^0.12.7`, `@supabase/supabase-js` `^2.118.0`)
- **Document / PDF Export:** `html2pdf.js` `^0.14.0`

---

## 2. Directory & Architecture Structure

```
question-hub/
├── app/                              # Next.js App Router (RSC & Routes)
│   ├── layout.tsx                    # Root layout with font & theme providers
│   ├── page.tsx                      # Root Home Landing page
│   ├── admin/                        # Protected Admin routes
│   │   ├── dashboard/                # System stats & metrics
│   │   ├── questions/                # Question management view
│   │   ├── reports/                  # User problem reports review
│   │   └── login/                    # Dedicated Admin authentication
│   ├── auth/callback/route.ts        # PKCE OAuth token exchange Route Handler
│   ├── dashboard/                    # User student/teacher dashboard
│   ├── login/ & register/            # Public Auth pages
│   ├── questions/                    # Public Question Explorer
│   ├── subjects/                     # Public Subjects Catalog
│   └── saved/                        # User Bookmarked Questions
│
├── src/
│   ├── components/
│   │   ├── admin/                    # Admin cards, modals, search & filters
│   │   ├── auth/                     # GoogleSignInButton, LoginForm, RegisterForm
│   │   ├── site/                     # Navbar, Footer, HeroCarousel, HomeFaqSection
│   │   └── ui/                       # Radix UI primitives (Accordion, Button, Card, Dialog)
│   │
│   ├── lib/
│   │   ├── admin/                    # question-actions.ts, question-search.ts
│   │   ├── auth/                     # session.ts, roles.ts, actions.ts
│   │   ├── i18n/                     # Bilingual client & server localization helpers
│   │   ├── math/                     # KaTeX formula parser and HTML sanitizer
│   │   ├── questions/                # storage.ts (Sharded Storage engine), filters.ts
│   │   └── supabase/                 # client.ts, server.ts, admin.ts, config.ts
│   └── data/                         # Static chapter mappings, metadata
│
├── docs/                             # 6-Document Architecture Specifications
└── public/                           # Static assets, SVG markers, brand media
```

---

## 3. High-Throughput Sharded Storage Architecture
Instead of expensive single-table queries over 50,000+ rich rows, QuestionBank uses a **Sharded Storage Engine** hosted in Supabase Storage (`qb-raw` / `questions-v2`):
1. **`manifest.json`:** Global index containing total questions, subject-wise totals, MCQ/Written counts, and shard counts. Cached in-memory with TTL and invalidation triggers.
2. **`shard-XXXX.json`:** 100 questions per JSON shard file.
3. **Type Folders (`/mcq/`, `/written/`):** Filtered sub-shards for immediate type-filtered queries.
4. **Fast In-Memory LRU Cache:** Server instances cache up to 80 active shards with automated invalidation when edits or deletions occur.

---

## 4. Security & Authentication Constraints
- **Session Management:** Secure HTTP-only cookies managed via `@supabase/ssr`.
- **Role-Based Access Control (RBAC):** Admin routes (`/admin/*`) strictly verify `role in ('admin', 'moderator')` inside Server Components.
- **Service Role Key Isolation:** `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-side action handlers (`src/lib/supabase/admin.ts`) and is never leaked to the browser.
- **Safe External Redirects:** `app/auth/callback/route.ts` strictly enforces safe relative paths or explicitly whitelisted hosts, blocking open-redirect vulnerabilities.
