# Hebrew Recipe Extractor

Extract and parse recipes from any cooking website — with full Hebrew language support. Paste a URL, get a clean structured recipe with ingredients, steps, and nutritional info. Then use **Cooking Mode** for an interactive step-by-step cooking assistant.

## Features

- **Recipe Extraction** — Paste any recipe URL and get a structured, clean recipe
- **Hebrew Support** — Full RTL layout, Hebrew unit conversion (כוס → cup, כף → tbsp), fraction normalization (חצי → 0.5)
- **AI-Powered Parsing** — Uses Claude Haiku 4.5 to intelligently extract recipe data from any page format
- **Cooking Mode** — Interactive step-by-step cooking guide with micro-steps, timers, and progress tracking
- **Kashrut Detection** — Automatically classifies recipes by kosher dietary category
- **Session Persistence** — Resume cooking sessions where you left off
- **Notes** — Add personal notes to any cooking step
- **History** — All extracted recipes saved to your account

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: Next.js 14 (App Router)
- **AI**: Claude Haiku 4.5 via Vercel AI SDK
- **Database**: Supabase (PostgreSQL) for recipes + auth, local SQLite for cooking session cache
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Setup

### Prerequisites

- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)
- [Anthropic API key](https://console.anthropic.com/)
- [Supabase project](https://supabase.com/) with the schema migration applied

### Installation

```bash
# Clone the repo
git clone https://github.com/shaikush6/hebrew-recipe-extractor.git
cd hebrew-recipe-extractor

# Install dependencies
bun install

# Copy environment template and fill in your keys
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` with your actual values:

```env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Setup

Apply the migration to your Supabase project:

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Push the migration
npx supabase db push
```

Or manually run the SQL in `supabase/migrations/001_initial_schema.sql` via the Supabase SQL Editor.

## Usage

### Web App (recommended)

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and:

1. Paste a recipe URL (works best with Hebrew cooking sites like Niki B, Hachama Sheli, etc.)
2. Click **חלץ מתכון** (Extract Recipe)
3. View the structured recipe with ingredients, steps, and metadata
4. Click **מצב בישול** (Cooking Mode) for interactive step-by-step guidance

### CLI

```bash
bun run extract <url>
```

Extracts a recipe and prints the structured output to the terminal.

## How It Works

```
URL → HTTP Fetch (+ Playwright fallback) → HTML Parsing → JSON-LD Detection
                                                              ↓
                                              Claude Haiku 4.5 (structured extraction)
                                                              ↓
                                              Zod Schema Validation → Structured Recipe
                                                              ↓
                                              Supabase (save) + Display (render)
```

1. **Fetch**: Downloads the page HTML (falls back to Playwright for JS-rendered sites)
2. **Parse**: Looks for JSON-LD structured data first, then falls back to raw HTML
3. **Extract**: Sends content to Claude with a Hebrew-aware prompt and Zod schema
4. **Validate**: Validates the AI output against a strict schema
5. **Store**: Saves to Supabase and displays the formatted recipe

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/
│   │   ├── extract/        # Recipe extraction endpoint
│   │   ├── cooking-mode/   # AI cooking mode generation
│   │   ├── cooking-sessions/  # Session CRUD
│   │   └── history/        # Saved recipes
│   ├── cooking/[id]/       # Cooking mode UI
│   └── auth/               # Login/register pages
├── components/
│   ├── cooking/            # Cooking mode components (steps, timer, notes)
│   ├── recipe/             # Recipe display components
│   └── ui/                 # Shared UI components
├── hooks/                  # React hooks (useCookingMode)
├── lib/                    # Database and utility functions
├── schemas/                # Zod validation schemas
├── services/               # Core extraction logic (fetcher, parser)
└── types/                  # TypeScript type definitions
```

## License

MIT
