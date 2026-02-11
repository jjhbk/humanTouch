# HiredAF — Multi-Agent Build Prompt for Claude Code

## Project Summary
**HiredAF** is a SaaS tool that helps job seekers optimize their resumes to beat ATS (Applicant Tracking Systems). Users paste their resume + a job description → get an ATS match score, keyword gap analysis, and AI-powered rewrite suggestions using their *real* experience. Freemium model. Born from the meme, built for real results.

**Tagline:** "Your resume, but it actually gets read."

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Anthropic Claude API (for rewrite suggestions), PDF parsing (pdf-parse), Zustand (state).

---

## Agent Prompts

### 🧠 AGENT 1: Team Lead / Architect
```
You are the TECH LEAD for "HiredAF" — a SaaS resume optimizer that scores resumes against job descriptions and gives AI-powered rewrite suggestions to beat ATS systems.

STACK: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, shadcn/ui, Zustand, pdf-parse.
DEPLOY: Vercel-ready.

YOUR TASKS:
1. Scaffold: `npx create-next-app@latest hiredaf --typescript --tailwind --app --src-dir`
2. Install deps:
   ```
   npm i framer-motion zustand lucide-react canvas-confetti pdf-parse
   npm i @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-progress @radix-ui/react-tooltip
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card badge tabs progress textarea tooltip
   ```
3. Create file structure:
   ```
   src/
   ├── app/
   │   ├── layout.tsx              # Root layout, fonts, metadata
   │   ├── page.tsx                # Landing/hero page
   │   ├── globals.css             # Tailwind + CSS vars + custom styles
   │   ├── optimize/
   │   │   └── page.tsx            # Main optimizer tool page
   │   └── api/
   │       ├── analyze/
   │       │   └── route.ts        # POST: analyze resume vs JD
   │       ├── rewrite/
   │       │   └── route.ts        # POST: AI rewrite suggestions
   │       └── parse-pdf/
   │           └── route.ts        # POST: extract text from PDF
   ├── components/
   │   ├── landing/
   │   │   ├── Hero.tsx            # Hero section with CTA
   │   │   ├── HowItWorks.tsx      # 3-step explainer
   │   │   ├── BeforeAfter.tsx     # Score comparison demo
   │   │   └── Pricing.tsx         # Free vs Pro tiers
   │   ├── optimizer/
   │   │   ├── ResumeInput.tsx     # Paste/upload resume
   │   │   ├── JobDescInput.tsx    # Paste job description
   │   │   ├── ScoreDisplay.tsx    # Circular ATS score + grade
   │   │   ├── KeywordAnalysis.tsx # Found/missing keywords
   │   │   ├── SuggestionList.tsx  # AI rewrite suggestions
   │   │   ├── RewritePanel.tsx    # Side-by-side original vs optimized
   │   │   └── ExportButton.tsx    # Download optimized resume
   │   ├── shared/
   │   │   ├── Navbar.tsx
   │   │   ├── Footer.tsx
   │   │   └── Logo.tsx
   │   └── ui/                     # shadcn components (auto-generated)
   ├── lib/
   │   ├── analyzer.ts             # Keyword extraction + matching logic
   │   ├── scorer.ts               # ATS score calculation
   │   ├── keywords.ts             # Industry keyword database
   │   ├── parser.ts               # Resume text parsing/cleaning
   │   └── types.ts                # All TypeScript interfaces
   ├── store/
   │   └── useOptimizerStore.ts    # Zustand global state
   └── hooks/
       ├── useAnalysis.ts          # Hook for analyze API
       └── useRewrite.ts           # Hook for rewrite API
   ```
4. Define all shared types in `types.ts`:
   ```ts
   interface ResumeData {
     rawText: string;
     sections: { header: string; content: string }[];
     skills: string[];
     experience: ExperienceItem[];
   }
   interface JobDescription {
     rawText: string;
     title: string;
     requiredSkills: string[];
     preferredSkills: string[];
     keywords: string[];
   }
   interface AnalysisResult {
     score: number;                    // 0-100
     grade: 'F'|'D'|'C'|'B'|'A'|'A+';
     matchedKeywords: string[];
     missingKeywords: string[];
     sectionScores: { section: string; score: number }[];
     suggestions: Suggestion[];
   }
   interface Suggestion {
     id: string;
     type: 'add_keyword' | 'rewrite' | 'reorder' | 'format';
     priority: 'high' | 'medium' | 'low';
     original?: string;
     suggested: string;
     reason: string;
   }
   ```
5. Set up Zustand store with: resumeText, jobDescText, analysisResult, isAnalyzing, isRewriting states.
6. Wire `optimize/page.tsx` with two-column layout: inputs on left, results on right.

Focus on architecture and wiring. Leave component internals to other agents.
```

---

### 🎨 AGENT 2: Design / UI Agent
```
You are the DESIGN AGENT for "HiredAF."

AESTHETIC: Bold, dark, confident. Think premium dev tool meets streetwear brand. Not corporate, not cutesy — this tool has ATTITUDE. Dark backgrounds, electric accent colors, sharp typography, satisfying micro-interactions.

YOUR TASKS:

1. **globals.css** — CSS variables:
   ```
   --bg-primary: #09090B (zinc-950)
   --bg-card: #18181B (zinc-900)
   --bg-elevated: #27272A (zinc-800)
   --accent-green: #22C55E (score good)
   --accent-yellow: #EAB308 (score mid)
   --accent-red: #EF4444 (score bad)
   --brand-primary: #8B5CF6 (violet-500)
   --brand-glow: #A78BFA (violet-400)
   --text-primary: #FAFAFA
   --text-secondary: #A1A1AA
   ```
   Add subtle grid background pattern, glow effects for interactive elements.

2. **Fonts** (next/font/google):
   - Display/headings: `Sora` (weight 700, 800) — geometric, modern, bold
   - Body: `DM Sans` (weight 400, 500, 600) — clean readability
   - Mono/scores: `JetBrains Mono` — for keywords, scores, code-like elements

3. **Landing Page Components:**
   - **Hero.tsx**: Large "Your resume, but it actually gets read." headline. Subtext about ATS. Big violet CTA "Optimize Now — Free". Animated background grid with subtle glow. Floating keyword badges animation.
   - **HowItWorks.tsx**: 3 steps — Paste (📄), Analyze (🔍), Optimize (🚀). Horizontal stepper with connecting lines, icons animate on scroll.
   - **BeforeAfter.tsx**: Two resume score cards side-by-side. Left: "Before" red score 34%. Right: "After" green score 92%. Animated counter on scroll.
   - **Pricing.tsx**: Two cards — Free (3 scans/day, basic suggestions) vs Pro $9/mo (unlimited, AI rewrites, PDF export). Highlight Pro with brand glow border.

4. **Optimizer Page Components:**
   - **ResumeInput.tsx**: Large textarea with "Paste your resume" placeholder. "Or upload PDF" button with drag-drop zone. Character count. Dark card styling.
   - **JobDescInput.tsx**: Same style. "Paste the job description" placeholder. Auto-detect job title display.
   - **ScoreDisplay.tsx**: THE STAR COMPONENT.
     - Large circular score gauge (SVG circle with animated stroke-dashoffset)
     - Color shifts: 0-40 red, 41-70 yellow, 71-100 green
     - Letter grade badge below
     - Pulsing glow effect matching score color
     - "ATS MATCH SCORE" label in mono font
   - **KeywordAnalysis.tsx**: Two columns — ✅ Found (green badges) and ❌ Missing (red badges with + button to add). Badge hover shows context.
   - **SuggestionList.tsx**: Stacked cards with priority indicator (colored left border). Each has: suggestion text, "Apply" button, reason tooltip. High priority has subtle pulse.
   - **RewritePanel.tsx**: Split view — left shows original bullet, right shows suggested rewrite. Diff-style highlighting. "Accept" / "Reject" buttons per suggestion.

5. **Animations** (Framer Motion):
   - Page transitions: fade + slide
   - Score circle: draw animation (1.5s ease-out)
   - Keywords: staggered pop-in (0.03s delay each)
   - Suggestions: slide in from right, staggered
   - Score counter: counting animation from 0 to final
   - Confetti burst when score > 85
   - Smooth layout animations when applying suggestions

6. **Responsive**: Mobile-first. Optimizer goes single-column on mobile with tab switching between Input/Results.

Make every interaction feel SATISFYING. This tool should feel premium even on free tier.
```

---

### ⚙️ AGENT 3: Backend / Logic Agent
```
You are the BACKEND AGENT for "HiredAF."

You own all analysis logic, API routes, and the AI integration layer.

YOUR TASKS:

1. **lib/keywords.ts** — Curated keyword database:
   ```ts
   // Organized by category
   const KEYWORD_DB = {
     programming: ["Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "C++", "Ruby", "Swift", "Kotlin", ...],
     frameworks: ["React", "Next.js", "Node.js", "Django", "Flask", "Spring Boot", "Express", "Vue", "Angular", "FastAPI", ...],
     cloud: ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins", "GitHub Actions", ...],
     data: ["SQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "Spark", "Airflow", ...],
     practices: ["Agile", "Scrum", "TDD", "microservices", "REST API", "GraphQL", "system design", ...],
     soft_skills: ["cross-functional", "stakeholder management", "mentoring", "leadership", ...],
     pm_specific: ["roadmap", "PRD", "user research", "A/B testing", "OKRs", "KPIs", "prioritization", ...],
     design_specific: ["Figma", "user flows", "wireframes", "design systems", "prototyping", "usability testing", ...],
     ml_specific: ["PyTorch", "TensorFlow", "NLP", "computer vision", "LLM", "fine-tuning", "RAG", ...],
   }
   ```
   Include synonym mapping: "JS" → "JavaScript", "k8s" → "Kubernetes", "ML" → "Machine Learning", etc.

2. **lib/parser.ts** — Resume text processing:
   - `parseResumeText(text: string): ResumeData`
   - Extract sections by common headers (Experience, Education, Skills, Projects, Summary)
   - Extract skills from both Skills section and inline mentions
   - Normalize text (lowercase matching, acronym expansion)
   - Handle PDF extracted text (clean artifacts, fix spacing)

3. **lib/analyzer.ts** — Core matching engine:
   - `analyzeMatch(resume: ResumeData, jd: JobDescription): AnalysisResult`
   - Keyword extraction from JD using NLP-lite approach:
     - Match against keyword DB
     - Extract noun phrases (simple regex patterns)
     - Identify required vs preferred (parse "required"/"must have" vs "nice to have"/"preferred" sections)
   - Scoring algorithm:
     ```
     Base score:
     - Required keyword matches: 40% weight
     - Preferred keyword matches: 20% weight
     - Skills section alignment: 15% weight
     - Experience relevance (keyword density in bullets): 15% weight
     - Format/structure score: 10% weight

     Bonuses: +5 for quantified achievements, +3 for action verbs
     Penalties: -10 for no skills section, -5 for wall-of-text formatting
     ```
   - Generate suggestions automatically:
     - Missing high-priority keywords → "add_keyword" suggestion
     - Weak bullet points (no metrics) → "rewrite" suggestion
     - Skills mentioned in experience but not Skills section → "reorder" suggestion

4. **lib/scorer.ts** — Score utilities:
   - `calculateScore(analysis): number` — 0-100
   - `getGrade(score): string` — F/D/C/B/A/A+
   - `getScoreColor(score): string` — red/yellow/green hex
   - `getScoreMessage(score): string` — e.g. "ATS will likely auto-reject" / "Strong match, likely to pass" / "Excellent — you're getting through"

5. **API Routes:**

   **POST /api/analyze** (`app/api/analyze/route.ts`):
   ```ts
   // Input: { resumeText: string, jobDescText: string }
   // Output: AnalysisResult
   // Pure logic, no AI needed. Fast response.
   ```

   **POST /api/rewrite** (`app/api/rewrite/route.ts`):
   ```ts
   // Input: { originalBullet: string, jobContext: string, missingKeywords: string[] }
   // Output: { rewritten: string, keywordsAdded: string[] }
   // Uses Claude API to rewrite a resume bullet point
   // incorporating missing keywords naturally.
   //
   // SYSTEM PROMPT for Claude:
   // "You are a resume optimization expert. Rewrite the following resume bullet point
   //  to naturally incorporate these keywords: [keywords]. Keep it truthful — do NOT
   //  fabricate experience. Only rephrase to highlight relevant skills the person
   //  likely has based on context. Use strong action verbs and quantify where the
   //  original supports it. Keep it to 1-2 lines."
   //
   // Use ANTHROPIC_API_KEY from env. Model: claude-sonnet-4-20250514.
   ```

   **POST /api/parse-pdf** (`app/api/parse-pdf/route.ts`):
   ```ts
   // Input: FormData with PDF file
   // Output: { text: string }
   // Use pdf-parse to extract text. Clean up artifacts.
   // Max file size: 5MB.
   ```

6. **Environment variables** (`.env.local`):
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```
   Add `.env.example` with placeholder.

IMPORTANT: The analyze endpoint must work WITHOUT an API key (pure logic). Only /api/rewrite needs Claude. This means free tier works without AI costs.
```

---

### 🧪 AGENT 4: QA / Polish Agent
```
You are the QA/POLISH AGENT for "HiredAF." Run after all other agents.

YOUR TASKS:

1. **Build check**: `npm run build` — fix ALL errors. Zero tolerance.

2. **Test the full flow**:
   - Paste sample resume + JD → verify score renders
   - Check keyword extraction accuracy with 3 different role types (SWE, PM, Designer)
   - Verify PDF upload works
   - Verify rewrite API returns valid suggestions (mock if no API key)
   - Test edge cases: empty inputs, very short resume, JD with no clear requirements

3. **Mobile responsiveness**: Test 375px, 768px, 1024px, 1440px. Optimizer page must be usable on mobile (tab layout for input/results).

4. **Performance**:
   - Analysis should complete in <500ms (it's client-logic heavy, no AI)
   - Add loading skeletons for score and keywords while analyzing
   - Lazy load landing page sections below fold

5. **Polish & finishing touches**:
   - Add toast notifications (sonner): "Analysis complete!", "Suggestion applied!", "Copied to clipboard!"
   - Add keyboard shortcut: Cmd+Enter to analyze
   - Add sample resume + JD as "Try Demo" button on optimizer page
   - Meta tags: og:title "HiredAF — Your resume, but it actually gets read", og:description, favicon
   - Add analytics-ready event stubs: `trackEvent('analyze', { score })`, `trackEvent('rewrite_applied')`

7. **Error handling**:
   - Graceful fallback if Claude API is down (show suggestions without AI rewrite)
   - Input validation with clear error messages
   - Rate limiting stub on API routes (comment with implementation notes)

8. Verify strict TypeScript — no `any` types, all interfaces properly used.
```

---

## Execution Order
```
1. Team Lead    → scaffold + types + store + page wiring
2. Backend      → keywords DB + analyzer + scorer + API routes  ⎫ parallel
3. Design/UI    → all components + landing page + animations    ⎭
4. QA/Polish    → build + test + mobile + meta + README
```

## One-Shot Claude Code Command
```bash
claude "Read AGENTS.md and build the full HiredAF project. Execute Agent 1 first (scaffold + architecture), then Agent 2 and 3 (interleave as needed), finish with Agent 4 (QA). The app should be fully functional and deployable to Vercel. Use placeholder for ANTHROPIC_API_KEY. Make the /api/analyze endpoint work fully without any API key (pure keyword matching logic). Make it look PREMIUM."
```
