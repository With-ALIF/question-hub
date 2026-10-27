# 01_PRD.md: Product Requirements Document (PRD)

## 1. Executive Summary & Vision
**QuestionBank (প্রশ্নব্যাংক)** is a high-performance, production-grade academic and admission preparation platform built for Bangladeshi students, teachers, institutions, and parents. It hosts tens of thousands of curated questions from Board Exams (HSC, SSC), College Test Papers, and Admission Tests (BUET/Engineering, Medical/Dental, Dhaka University, GST Unified).

---

## 2. Target Personas
1. **HSC / SSC Students:** Searching for board questions by chapter, topic, and year with verified answers and explanations.
2. **University Admission Aspirants:** Practicing Engineering, Medical, and General University MCQ and Written questions.
3. **Teachers & Educators:** Creating custom question sets, lecture sheets, and exams in minutes.
4. **Parents:** Tracking student progress, practicing topics, and conducting home tests.
5. **Platform Administrators:** Managing questions, reviewing duplicate items, resolving user error reports, and monitoring real-time system metrics.

---

## 3. Core Problems Solved
- **Scattered & Inaccurate Resources:** Students often rely on physical guidebooks with outdated answers, printing errors, and no quick search.
- **Complex Math & Science Typography:** Inability of existing platforms to render LaTeX, chemical formulas, superscripts, subscripts, and Bengali mathematical figures accurately.
- **High Latency at Scale:** Traditional SQL query bottlenecks when filtering through 50,000+ rich questions with HTML and math expressions. (Solved via QuestionBank Sharded JSON Storage + Manifest Cache).
- **Exam Paper Creation Complexity:** Difficulty for teachers to compile and export printable exam papers with answer keys in 3 steps.

---

## 4. MVP User Stories & Features
- **US-01 (Question Discovery):** As a student, I can filter questions by Subject, Type (MCQ/Written), Chapter, Topic, Year, and Institution in under 200ms.
- **US-02 (Rich Formula Rendering):** As a student, I can view complex mathematical and chemical formulas rendered crisp and error-free via KaTeX.
- **US-03 (Authentication & Sync):** As a user, I can authenticate with Email/Password or 1-click Google Sign-In and land directly on my dashboard.
- **US-04 (Saved / Bookmark Questions):** As a student, I can bookmark difficult questions to my personal saved list for offline or quick review.
- **US-05 (Exam Paper Generator):** As a teacher, I can select questions, configure header/paper settings, and download/print clean PDF exam sheets with auto-generated answer keys.
- **US-06 (Admin Question Management):** As an admin, I can search all questions by ID or keyword, detect duplicate questions, edit details, and delete questions with instant 1-second storage shard and manifest synchronization.
- **US-07 (Error Reporting):** As a student, I can report mistakes in question text or explanations, and admins can resolve or fix them from the admin panel.

---

## 5. Success Metrics (KPIs)
- **Time-to-First-Question:** < 300ms on first page load.
- **Search Query Latency:** < 500ms across 20,000+ questions.
- **Math Render Failure Rate:** 0% (graceful fallback to raw text if KaTeX fails).
- **Admin Shard Sync:** < 1.5 seconds for complete deletion / update across Storage shards and `manifest.json`.
- **System Uptime:** 99.9% backed by Vercel Edge and Supabase Global CDN.

---

## 6. Strict "Out of Scope" (Non-Goals for MVP)
- Real-time multiplayer quiz battles (Scheduled for v2.0).
- Paid payment gateway integrations (Nagad/bKash checkout is currently mock / manual activation).
- Native mobile apps on Flutter / React Native (Responsive PWA web app serves all devices for MVP).
- Full OCR automated question ingestion from camera snapshots (Scheduled for post-launch).
