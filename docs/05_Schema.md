# 05_Schema.md: Relational Database Schema & RLS Security

## 1. Relational Schema Architecture

```
auth.users (Supabase Managed Auth)
   │
   ├── 1:1 ──► public.profiles (User details & roles)
   │               │
   │               ├── 1:N ──► public.saved_questions (User bookmarks)
   │               └── 1:N ──► public.question_reports (Feedback / Error reports)
   │
   └── Admin Tables:
         ├── public.qb_subjects (Subjects catalog metadata)
         ├── public.qb_features (Feature toggles & platform modules)
         └── public.qb_questions (Database backup of storage shards)
```

---

## 2. Table Definitions & DDL

### 2.1 `public.profiles`
Stores user profile information, role designation, and active subscription plan.
```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NULL,
  avatar_url text NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'teacher', 'moderator', 'admin')),
  plan_name text NOT NULL DEFAULT 'free',
  plan_expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
```

### 2.2 `public.qb_subjects`
Manages subjects catalog, slug keys, display names, order, and active states.
```sql
CREATE TABLE public.qb_subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  tagline text NULL,
  icon text NULL,
  accent text NULL,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qb_subjects_pkey PRIMARY KEY (id),
  CONSTRAINT qb_subjects_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)
);
```

### 2.3 `public.qb_features`
Platform feature toggles and modular capabilities.
```sql
CREATE TABLE public.qb_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qb_features_pkey PRIMARY KEY (id),
  CONSTRAINT qb_features_key_format CHECK (key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)
);
```

### 2.4 `public.saved_questions`
Stores student saved / bookmarked questions for personal review.
```sql
CREATE TABLE public.saved_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_questions_pkey PRIMARY KEY (id),
  CONSTRAINT saved_questions_unique UNIQUE (user_id, question_id)
);

CREATE INDEX idx_saved_questions_user ON public.saved_questions(user_id);
```

### 2.5 `public.question_reports`
User-submitted feedback and issue reports regarding question accuracy.
```sql
CREATE TABLE public.question_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  question_id text NOT NULL,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('wrong_answer', 'typo', 'formula_error', 'explanation_missing', 'other')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  resolved_by uuid NULL REFERENCES auth.users(id),
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_reports_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_question_reports_status ON public.question_reports(status);
```

---

## 3. Row-Level Security (RLS) Policies

```sql
-- Enable RLS across all application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_features ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Saved Questions
CREATE POLICY "Users can view own saved questions" ON public.saved_questions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved questions" ON public.saved_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved questions" ON public.saved_questions
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Subjects & Features
CREATE POLICY "Anyone can view active subjects" ON public.qb_subjects FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active features" ON public.qb_features FOR SELECT USING (is_active = true);
```
