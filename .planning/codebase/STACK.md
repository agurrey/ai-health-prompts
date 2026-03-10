# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5 - Full codebase (src/, components, lib, data)
- JavaScript - Service worker (`app/public/sw.js`), configuration files
- CSS - Styling via Tailwind + custom CSS variables

**Secondary:**
- Markdown - Static prompt content served from `/public/prompts/`

## Runtime

**Environment:**
- Node.js (LTS recommended, no version lock file)

**Package Manager:**
- npm (based on package-lock.json presence)
- No lockfile version specified in repository

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework, App Router
- React 19.2.3 - UI component library
- React DOM 19.2.3 - DOM rendering

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - PostCSS integration
- Custom CSS variables in `src/app/globals.css` (theme: background, foreground, accent, muted, card, border)

**Build/Dev:**
- TypeScript 5 - Type checking
- ESLint 9 - Code linting
- eslint-config-next 16.1.6 - Next.js ESLint configuration preset
- Next.js built-in compiler - No separate build tool needed

## Key Dependencies

**Critical:**
- @vercel/analytics 1.6.1 - Event tracking (workout generation, page views)
  - Imported as: `import { Analytics } from "@vercel/analytics/next"`
  - Exposed function: `track()` for custom events

**Infrastructure:**
- None (frontend-only, no backend SDK/ORM)

## Configuration

**Environment:**
- No environment variables required (see `.gitignore` - `.env*` excluded)
- No secrets management needed (client-side only)
- Geist font family from Google Fonts (loaded via `next/font/google`)

**Build:**
- `next.config.ts` - Next.js configuration
  - Security headers enabled: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
  - Service Worker caching headers configured
  - No custom webpack, no API routes

**TypeScript:**
- Target: ES2017
- Module: ESNext (bundler-managed)
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- No incremental build configured

## Platform Requirements

**Development:**
- Node.js LTS
- npm
- Modern browser with Service Worker support
- No database, no external services required

**Production:**
- Vercel platform (deployment target)
- Static + streaming hybrid (Next.js App Router optimizations)
- PWA capable (manifest.json, service worker, installable)
- CDN via Vercel Edge Network

## Build & Deploy

**Dev:**
```bash
npm run dev       # Next.js dev server on port 3000
```

**Production:**
```bash
npm run build     # Next.js static export + streaming
npm run start     # Production server
```

**Deployment:**
- Target: Vercel (implied by `@vercel/analytics`, no custom adapters)
- Service Worker cached at `/sw.js` with `Cache-Control: no-cache`
- PWA manifest at `/manifest.json`
- Static assets caching strategy: cache-first for `/_next/static/`, `/icons/`

---

*Stack analysis: 2026-03-10*
