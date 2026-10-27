# 06_Plan.md: Implementation Roadmap & Execution Checklist

> **Rule for AI Coding Agent:** Check off items sequentially as they are verified. Do not proceed to the next phase without confirming zero compilation errors (`npx tsc --noEmit`).

---

## Phase 1: Database Architecture, Security & Authentication
- [x] **1.1 Database Schema:** Create `profiles`, `qb_subjects`, `qb_features`, `saved_questions`, and `question_reports` with strict constraints and timestamps triggers.
- [x] **1.2 Supabase RLS:** Define Row-Level Security policies ensuring private user data isolation.
- [x] **1.3 Next.js Supabase Clients:** Implement `@supabase/ssr` server, browser, and isolated admin service role client factories.
- [x] **1.4 Auth Flow:** Complete Email/Password login/registration forms with Zod validation.
- [x] **1.5 Google OAuth:** Implement 1-click Google Sign-In with automated PKCE callback handling at `/auth/callback` and direct redirect to `/dashboard`.
- [x] **1.6 RBAC Protection:** Setup role verification utilities (`getCurrentRole()`) and protect `/admin/*` routes.

---

## Phase 2: Sharded Storage Engine & Core Question APIs
- [x] **2.1 Storage Manifest Engine:** Load, normalize, and cache `manifest.json` with TTL and invalidation triggers.
- [x] **2.2 High-Throughput Shard Loader:** Implement `getQuestionShard(subject, shardNumber, type)` with in-memory LRU caching up to 80 shards.
- [x] **2.3 Faceted Filtering & Search:** Build multi-dimensional filtering across subject, chapter, topic, year, institution, and type.
- [x] **2.4 High-Speed Admin Search:** Index shards in background for sub-second keyword and ID matching.
- [x] **2.5 Admin Instant Question Delete:** Implement concurrent `Promise.all` deletion across main shard, type shard, database table, and manifest with 0ms optimistic UI update.

---

## Phase 3: UI Integration & User Experience Excellence
- [x] **3.1 Design System & Theme:** Implement HSL token-based CSS variables, dark/light theme switcher, and typography hierarchy.
- [x] **3.2 Landing Page Experience:**
  - Hero Carousel with smooth autoplay and transitions.
  - Quick subject cards with live counts and accent styling.
  - Interactive pricing breakdown.
  - 14-item single-collapsible FAQ accordion (`HomeFaqSection`).
- [x] **3.3 KaTeX Math & Formula Engine:** Format LaTeX, AsciiMath, chemical formulas, and Bengali numerical notations cleanly with image lightbox support.
- [x] **3.4 Bookmark & Saved Questions View:** Enable students to view, filter, and review their bookmarked questions at `/saved`.
- [x] **3.5 PDF Exam Paper Generator:** Implement 3-step question sheet compiler and clean printable PDF export via `html2pdf.js`.

---

## Phase 4: Production Hardening, Edge Cases & Verification
- [x] **4.1 TypeScript Compiler Health:** Verify `npx tsc --noEmit` exits with 0 errors across all routes and components.
- [x] **4.2 Responsive & Cross-Device Audit:** Verify fluid layouts from 320px mobile to 1440px desktop screens.
- [x] **4.3 Error Boundaries & Empty States:** Ensure every view provides localized Bengali empty states and friendly error fallbacks.
- [ ] **4.4 Automated E2E Test Suite:** Implement Playwright tests covering login, question browsing, and admin deletion workflows.
- [ ] **4.5 Production Deployment Verification:** Deploy to Vercel production and verify SSL, environment secrets, and global CDN caching.
