# CLAUDE.md — OpositaPlus

## Stack & Versions
- **Next.js** 16.1.6 (App Router, Turbopack default)
- **React** 19.2.3
- **TypeScript** 5.x (strict mode)
- **Tailwind CSS** 4.x (PostCSS plugin, `@import 'tailwindcss'` syntax)
- **shadcn/ui** (new-york style, RSC, `radix-ui` package — NOT `@radix-ui/*`)
- **Supabase** (@supabase/ssr 0.8 + @supabase/supabase-js 2.95)
- **Stripe** 20.x (server) + @stripe/stripe-js 8.x (client)
- **Trigger.dev** SDK 4.3 (background jobs)
- **Sentry** @sentry/nextjs 10.38
- **OpenAI** 6.x
- **Vitest** 4.x + Testing Library + happy-dom
- **Icons**: lucide-react
- **Charts**: recharts 3.x
- **Date**: date-fns 4.x

## Project Structure
```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind 4 entry (@import 'tailwindcss' + @theme)
│   ├── api/                # Route handlers (check-answer, generate-plan, generate-test, tutor)
│   ├── auth/callback/      # Supabase auth callback
│   ├── admin/              # Admin panel (layout + pages)
│   ├── centro/[slug]/      # Individual center pages
│   ├── centros/            # Centers listing
│   ├── login/              # Auth page
│   ├── registro/           # Registration
│   ├── registro-centro/    # Center registration
│   ├── onboarding/         # User onboarding
│   └── oposiciones/[slug]/ # Exam categories
├── components/
│   ├── ui/                 # shadcn/ui components (button, card, dialog, etc.)
│   ├── centro/             # Center-specific components
│   ├── oposiciones/        # Exam-specific components
│   └── *.tsx               # Shared components (site-nav, auth-guard, etc.)
├── lib/
│   ├── supabase/
│   │   ├── server.ts       # createClient() — server (cookies-based)
│   │   ├── client.ts       # createClient() — browser
│   │   └── middleware.ts   # updateSession()
│   ├── stripe/             # Stripe helpers
│   ├── 100ms/              # 100ms video SDK
│   ├── actions/            # Server actions
│   ├── hooks/              # Custom React hooks
│   ├── email/              # Email templates
│   ├── utils.ts            # cn() helper
│   ├── auth-context.tsx    # Auth context provider
│   ├── demo-data.ts        # Seed/demo data
│   └── types/              # TypeScript types
├── trigger/                # Trigger.dev jobs
│   ├── process-resource.ts
│   ├── generate-questions.ts
│   └── process-recording.ts
├── __tests__/              # Vitest tests
├── data/                   # Static data (oposiciones catalog)
├── middleware.ts           # Supabase session middleware
└── components.json         # shadcn config (new-york, RSC, lucide)
```

## Import Conventions
- **Path alias**: `@/*` → `./*` (root-relative)
- Example: `import { Button } from "@/components/ui/button"`
- Example: `import { createClient } from "@/lib/supabase/server"`
- Example: `import { cn } from "@/lib/utils"`

## Supabase Patterns
```typescript
// Server Component / Route Handler / Server Action
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient(); // async — uses cookies()

// Client Component
import { createClient } from "@/lib/supabase/client";
const supabase = createClient(); // sync — browser client
```
- Middleware handles session refresh via `updateSession()`
- Auth callback at `/app/auth/callback/route.ts`

## UI Component Conventions
- shadcn/ui new-york style with RSC support
- **IMPORTANT**: This project uses `radix-ui` (monorepo package), NOT `@radix-ui/*`
  - Slot: `import { Slot } from "radix-ui"` → use as `Slot.Root`
- `cn()` from `@/lib/utils` for class merging (clsx + tailwind-merge)
- `cva` from `class-variance-authority` for variant components
- Icons from `lucide-react`
- Tailwind 4 CSS: use `@theme` for custom colors, `@import 'tailwindcss'`

## API Route Conventions
- Route handlers in `app/api/[name]/route.ts`
- Export named functions: `GET`, `POST`, etc.
- Use `NextRequest`/`NextResponse` from `next/server`

## Background Jobs (Trigger.dev)
- Jobs in `trigger/` directory
- Config in `trigger.config.ts`
- Pattern: `import { task } from "@trigger.dev/sdk/v3"`

## Testing
- **Runner**: Vitest 4.x with happy-dom
- **Location**: `__tests__/` directory
- **Commands**: `npm test` (watch), `npm run test:run` (CI)
- **Libraries**: @testing-library/react, @testing-library/jest-dom

## Deploy
- **Platform**: Vercel
- **Build**: `next build`
- Sentry source maps uploaded on CI (`SENTRY_ORG`, `SENTRY_PROJECT` env vars)

## Common Mistakes to Avoid
1. ❌ `import { Slot } from "@radix-ui/react-slot"` → ✅ `import { Slot } from "radix-ui"` then `Slot.Root`
2. ❌ Tailwind 3 config (`tailwind.config.js`) → ✅ Tailwind 4 uses `@theme` in CSS
3. ❌ Sync `createClient()` on server → ✅ Always `await createClient()` (server uses `cookies()`)
4. ❌ Using `"use client"` unnecessarily → Server Components by default
5. ❌ `@tailwind base` directives → ✅ `@import 'tailwindcss'` (v4 syntax)
6. ❌ Direct `rm` on files → ✅ Use trash (recoverable)
7. ❌ Importing from `next/router` → ✅ Use `next/navigation` (App Router)
