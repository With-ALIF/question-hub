# 03_UI_Spec.md: Design System Specification & Token Architecture

## 1. Design Philosophy
QuestionBank adheres to an ultra-modern, high-trust educational aesthetic:
- **Clean Academic Precision:** Balanced whitespace, high-legibility Bengali fonts, and uncluttered math formulas.
- **Glassmorphism & Depth:** Soft backdrops (`backdrop-blur-md`), subtle borders (`border-border/80`), and micro-shadows (`shadow-xs` / `shadow-sm`).
- **Dark & Light Mode Parity:** Full CSS custom variable tokens with zero contrast compromise.

---

## 2. Color Palette & Token Mapping

### 2.1 Core HSL Theme Tokens

| Token | Light Mode (Hex / HSL) | Dark Mode (Hex / HSL) | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `#FFFFFF` (`0 0% 100%`) | `#090D16` (`222 47% 6%`) | App Canvas |
| `--foreground` | `#0F172A` (`222 47% 11%`) | `#F8FAFC` (`210 40% 98%`) | Primary Body Text |
| `--card` | `#FFFFFF` (`0 0% 100%`) | `#0F172A` (`222 47% 11%`) | Cards & Panels |
| `--primary` | `#0D9488` (`173 80% 32%`) | `#14B8A6` (`173 80% 40%`) | Brand Teal Accent |
| `--primary-foreground` | `#FFFFFF` (`0 0% 100%`) | `#042F2E` (`173 84% 10%`) | Button Text on Primary |
| `--secondary` | `#F1F5F9` (`210 40% 96%`) | `#1E293B` (`217 33% 17%`) | Subtle interactive surfaces |
| `--muted` | `#F8FAFC` (`210 40% 98%`) | `#1E293B` (`217 33% 17%`) | Inactive / Muted fields |
| `--muted-foreground` | `#64748B` (`215 16% 47%`) | `#94A3B8` (`215 20% 65%`) | Subtitles, hints, meta tags |
| `--border` | `#E2E8F0` (`214 32% 91%`) | `#334155` (`217 33% 27%`) | Container Borders |
| `--destructive` | `#EF4444` (`0 84% 60%`) | `#DC2626` (`0 72% 51%`) | Delete modals, alerts |

### 2.2 Subject Specific Accent Accents
- **Physics:** Blue / Sky (`text-sky-500`, `bg-sky-500/10`)
- **Chemistry:** Teal / Emerald (`text-teal-500`, `bg-teal-500/10`)
- **Mathematics:** Violet / Purple (`text-violet-500`, `bg-violet-500/10`)
- **Biology:** Green / Lime (`text-emerald-500`, `bg-emerald-500/10`)
- **ICT:** Orange / Amber (`text-amber-500`, `bg-amber-500/10`)

---

## 3. Typography Scale & Bengali Font Stack

### Font Families
- **Display Headings:** `"Hind Siliguri"`, `"Plus Jakarta Sans"`, sans-serif
- **Body & Rich Math:** `"Hind Siliguri"`, `"Inter"`, system-ui, sans-serif
- **Code & Question IDs:** `ui-monospace`, `SFMono-Regular`, `Menlo`, monospace

### Typography Hierarchy
- **Hero Title (`h1`):** `text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight`
- **Section Heading (`h2`):** `text-2xl sm:text-3xl font-bold tracking-tight`
- **Card Title (`h3`):** `text-lg sm:text-xl font-semibold`
- **Question Body:** `text-sm sm:text-base leading-relaxed break-words`
- **Meta / Options Badge:** `text-xs font-medium`

---

## 4. Spacing, Radii & Grid Rules
- **Corner Radii:**
  - Small pills & badges: `rounded-lg` (8px) or `rounded-full`
  - Action buttons & inputs: `rounded-xl` (12px)
  - Cards, Modals, Accordions: `rounded-2xl` (16px)
- **Container Max-Widths:**
  - Standard Content: `max-w-6xl` (1152px)
  - Admin Explorer: `max-w-7xl` (1280px)
  - Authentication Cards: `max-w-md` (448px)
- **Grid Layouts:**
  - Subject Cards: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`
  - FAQ Grid: `grid grid-cols-1 lg:grid-cols-2 gap-4 items-start`

---

## 5. KaTeX Math & Chemical Formula Rules
- Formulas wrapped in `$...$` or `$$...$$` are rendered client-side via KaTeX.
- AsciiMath characters like `x^2`, `H_2O`, `\frac{a}{b}` are automatically normalized.
- Bengali numbers inside equations (e.g. `১, ২, ৩`) are mapped to standard digits during math parsing, then rendered in high-legibility math glyphs.
- Images inside question descriptions render with responsive sizing and click-to-preview full resolution lightbox.
