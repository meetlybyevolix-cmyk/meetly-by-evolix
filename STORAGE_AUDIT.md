# Meetly — Storage Footprint Audit & Analysis

**Project:** Meetly  
**Location:** `D:\meetly`  
**Maintained by:** Evolix Studio  
**Audit Date:** 2026-10-30  
**Initial Monorepo Metrics:**
- **Total Directory Size:** 469.48 MB (492,280,305 bytes)
- **Total Files:** 53,586
- **Total Folders:** 6,751

---

## 1. Top-Level Directory and File Size Analysis

| Directory or File | Size | File Count | Dir Count | Purpose | Can Be Regenerated? | Safe to Delete from Source / Working Repo? | Expected Storage Savings |
|---|---|---|---|---|---|---|---|
| `node_modules/` | 466.11 MB | 52,851 | 6,497 | Local dependencies and package bins | Yes (`pnpm install --frozen-lockfile`) | Exclude from delivery ZIP; keep in working tree or prune stale packages | ~466.11 MB in ZIP / ~35 MB in node_modules |
| `.git/` | 1.22 MB | 464 | 224 | Git version control history & metadata | No (contains commit history) | **DO NOT DELETE** from working repo; Exclude from delivery ZIP | ~1.22 MB in ZIP |
| `dist/` | 820.57 KB | 6 | 2 | Production build bundle outputs (Vite client + esbuild backend) | Yes (`pnpm build`) | Yes (clean before build/package) | ~820 KB |
| `client/` | 493.04 KB | 84 | 9 | React frontend source code, components, CSS | No | **DO NOT DELETE** (Essential source); Can prune 40 unused UI components | ~140 KB source code reduction |
| `server/` | 291.99 KB | 30 | 3 | Backend Express server, WebSockets, WebRTC signaling, auth, DB | No | **DO NOT DELETE** (Essential source) | 0 B |
| `pnpm-lock.yaml` | 204.05 KB | 1 | 0 | Deterministic package lockfile | Can be updated via pnpm | **DO NOT DELETE** (Preserve lockfile integrity) | 0 B |
| Root Docs & Reports (`*.md`) | ~240 KB | 20 | 0 | Verification audits, security reviews, phase delivery reports | No | Preserve core documentation; exclude obsolete dev scratch logs | ~50 KB |
| `docs/` | 39.72 KB | 4 | 0 | Launch checklist, incident response, privacy data mapping | No | **DO NOT DELETE** (Essential compliance documentation) | 0 B |
| `scripts/` | 28.35 KB | 3 | 0 | E2E smoke tests, load testing scripts, moderation tools | No | **DO NOT DELETE** (Essential operational scripts) | 0 B |
| `drizzle/` | 16.32 KB | 9 | 2 | Drizzle ORM schema migrations and metadata | No | **DO NOT DELETE** (Essential DB migration history) | 0 B |
| `data/` (`data/uploads/`) | 3.65 KB | 90 | 1 | Test image upload outputs from automated Vitest suites | Yes (recreated on test run) | Yes (safe to wipe dummy test uploads) | ~3.65 KB |
| Config files (`package.json`, `Dockerfile`, `docker-compose.yml`, `tsconfig.json`, `vite.config.ts`, etc.) | ~15 KB | 12 | 0 | Project configuration, runtime setups, build pipelines | No | **DO NOT DELETE** (Required configuration) | 0 B |

---

## 2. 30 Largest Files in the Project

All 30 of the largest files across the entire project repository originate from `node_modules/`:

| Rank | Size | File Path | Category / Purpose | Action Plan |
|---|---|---|---|---|
| 1 | 11.15 MB | `node_modules/.pnpm/@esbuild+win32-x64@0.28.2/.../esbuild.exe` | esbuild native binary | Essential tool (used by Vite/bundle) |
| 2 | 10.31 MB | `node_modules/.pnpm/mermaid@11.12.0/.../mermaid.min.js.map` | Orphaned package sourcemap | Prune (not in package.json) |
| 3 | 10.27 MB | `node_modules/.pnpm/mermaid@11.12.0/.../mermaid.js.map` | Orphaned package sourcemap | Prune (not in package.json) |
| 4 | 10.07 MB | `node_modules/.pnpm/@esbuild+win32-x64@0.25.10/.../esbuild.exe` | Duplicate older esbuild binary | Pruned on lockfile refresh |
| 5 | 9.45 MB | `node_modules/.pnpm/@esbuild+win32-x64@0.21.5/.../esbuild.exe` | Duplicate older esbuild binary | Pruned on lockfile refresh |
| 6 | 9.11 MB | `node_modules/.pnpm/@esbuild+win32-x64@0.18.20/.../esbuild.exe` | Duplicate older esbuild binary | Pruned on lockfile refresh |
| 7 | 8.69 MB | `node_modules/.pnpm/typescript@5.9.3/.../typescript.js` | TypeScript compiler runtime | Essential devDependency |
| 8 | 8.34 MB | `node_modules/.pnpm/lightningcss-win32-x64-msvc@1.30.1/.../lightningcss.node` | Native CSS transformer | Essential dependency (Vite / Tailwind) |
| 9 | 7.37 MB | `node_modules/.pnpm/pnpm@10.18.0/.../pnpm.cjs` | Bundled pnpm devDependency | Remove from package.json devDependencies |
| 10 | 6.44 MB | `node_modules/.pnpm/superjson@1.13.3/.../non-deduped-cal.json` | superjson fixture artifact | Upstream package asset |
| 11 | 6.17 MB | `node_modules/.pnpm/mermaid@11.12.0/.../mermaid.js` | Orphaned package runtime | Prune (not in package.json) |
| 12 | 5.93 MB | `node_modules/.pnpm/typescript@5.9.3/.../_tsc.js` | TypeScript compiler CLI | Essential devDependency |
| 13 | 5.14 MB | `node_modules/.pnpm/lucide-react@0.542.0/.../lucide-react.js.map` | Lucide icons sourcemap | Pruned by deduping lucide |
| 14 | 5.05 MB | `node_modules/.pnpm/lucide-react@0.542.0/.../lucide-react.js.map` | Lucide icons sourcemap | Pruned by deduping lucide |
| 15 | 4.42 MB | `node_modules/.pnpm/cytoscape-fcose@2.2.0/.../demo.gif` | Orphaned demo GIF | Prune (not in package.json) |
| 16 | 4.17 MB | `node_modules/.pnpm/lucide-react@0.453.0/.../lucide-react.js.map` | Lucide icons sourcemap | Upstream package asset |
| 17 | 4.11 MB | `node_modules/.pnpm/lucide-react@0.453.0/.../lucide-react.js.map` | Lucide icons sourcemap | Upstream package asset |
| 18 | 4.01 MB | `node_modules/.pnpm/lucide-react@0.542.0/.../lucide-react.min.js.map` | Lucide sourcemap | Pruned on lockfile refresh |
| 19 | 3.62 MB | `node_modules/.pnpm/lucide-react@0.453.0/.../lucide-react.min.js.map` | Lucide sourcemap | Upstream package asset |
| 20 | 3.56 MB | `node_modules/.pnpm/drizzle-kit@0.31.5/.../bin.cjs` | Drizzle CLI binary | Essential devDependency |
| 21 | 3.03 MB | `node_modules/.pnpm/@tailwindcss+oxide-win32-x64-msvc@4.1.14/.../tailwindcss-oxide.node` | Tailwind CSS native engine | Essential devDependency |
| 22 | 3.03 MB | `node_modules/.pnpm/cytoscape-fcose@2.2.0/.../incrementalConstraints.gif` | Orphaned demo GIF | Prune (not in package.json) |
| 23 | 2.62 MB | `node_modules/.pnpm/mermaid@11.12.0/.../mermaid.min.js` | Orphaned package | Prune (not in package.json) |
| 24 | 2.57 MB | `node_modules/.pnpm/@rollup+rollup-win32-x64-msvc@4.52.4/.../rollup.node` | Rollup native binary | Essential build dependency |
| 25 | 2.10 MB | `node_modules/.pnpm/date-fns@4.1.0/.../cdn.js.map` | date-fns sourcemap | Remove date-fns (unused) |
| 26 | 2.08 MB | `node_modules/.pnpm/lucide-react@0.542.0/.../dynamic.d.ts` | Lucide icon types | Pruned on lockfile refresh |
| 27 | 2.08 MB | `node_modules/.pnpm/lucide-react@0.542.0/.../dynamicIconImports.d.ts` | Lucide icon types | Pruned on lockfile refresh |
| 28 | 2.00 MB | `node_modules/.pnpm/@rollup+rollup-win32-x64-gnu@4.52.4/.../rollup.node` | Rollup native binary | Upstream rollup fallback |
| 29 | 2.00 MB | `node_modules/.pnpm/lucide-react@0.542.0/.../lucide-react.d.ts` | Lucide icon types | Pruned on lockfile refresh |
| 30 | 1.99 MB | `node_modules/.pnpm/vite@5.4.20/.../dep-D_zLpgQd.js` | Legacy Vite chunk | Pruned on lockfile refresh |

---

## 3. 30 Largest Non-`node_modules` Files

Excluding `node_modules/`, the entire project is remarkably compact (~3.37 MB total):

| Rank | Size | File Path | Status & Purpose |
|---|---|---|---|
| 1 | 549.4 KB | `dist/public/assets/index-BZnWnZ6o.js` | Production frontend JS bundle (rebuilt with `pnpm build`) |
| 2 | 204.1 KB | `pnpm-lock.yaml` | Deterministic dependency lockfile (preserved) |
| 3 | 139.4 KB | `dist/index.js` | Production backend Node.js bundle (rebuilt with `pnpm build`) |
| 4 | 130.5 KB | `dist/public/assets/index-BYfppOnD.css` | Production CSS bundle (rebuilt with `pnpm build`) |
| 5 | 99.0 KB | `.git/objects/5b/552745dd...` | Git commit/blob object (preserved) |
| 6 | 67.1 KB | `client/src/index.css` | Application design system stylesheet (preserved) |
| 7 | 57.6 KB | `.git/objects/09/5d6391c7...` | Git object (preserved) |
| 8 | 49.6 KB | `client/src/pages/Home.tsx` | Main application landing & chat interface (preserved) |
| 9 | 41.7 KB | `client/src/components/VideoCall.tsx` | WebRTC video calling & side chat interface (preserved) |
| 10 | 35.1 KB | `PHASE7_FEATURE_REPORT.md` | Verification documentation (preserved) |
| 11 | 33.2 KB | `server/_core/index.ts` | Backend HTTP & WebSocket server entry (preserved) |
| 12 | 28.4 KB | `server/chat/service.ts` | Matchmaking and room lifecycle service (preserved) |
| 13 | 26.6 KB | `server/db.ts` | MySQL persistence & compliance store (preserved) |
| 14 | 21.4 KB | `client/src/components/ui/sidebar.tsx` | UI component (unused shadcn scaffold — safe to remove) |
| 15 | 19.9 KB | `client/src/pages/legal/PrivacyPolicy.tsx` | Compliance legal page (preserved) |
| 16 | 19.7 KB | `GOOGLE_AUTH_SHEETS_REPORT.md` | Phase 8 documentation (preserved) |
| 17 | 19.0 KB | `MEETLY_PUBLIC_LAUNCH_REPORT.md` | Public launch audit report (preserved) |
| 18 | 18.9 KB | `.git/objects/a6/24562e...` | Git object (preserved) |
| 19 | 18.9 KB | `.git/objects/26/7cdb75...` | Git object (preserved) |
| 20 | 18.5 KB | `server/security.test.ts` | Security & vulnerability test suite (preserved) |
| 21 | 17.8 KB | `MEETLY_RELEASE_REPORT.md` | Release documentation (preserved) |
| 22 | 17.7 KB | `.git/objects/6e/37c6f9...` | Git object (preserved) |
| 23 | 17.5 KB | `client/src/pages/legal/TermsOfService.tsx` | Compliance legal page (preserved) |
| 24 | 17.4 KB | `client/src/pages/legal/GrievanceRedressal.tsx` | Compliance legal page (preserved) |
| 25 | 16.9 KB | `.git/index` | Git working tree staging index (preserved) |
| 26 | 16.9 KB | `AUDIT_REPORT.md` | Security audit report (preserved) |
| 27 | 16.5 KB | `server/integration.test.ts` | Integration test suite (preserved) |
| 28 | 16.2 KB | `server/media.test.ts` | Photo upload validation test suite (preserved) |
| 29 | 16.1 KB | `server/chat/media.ts` | Upload security, magic bytes & MIME engine (preserved) |
| 30 | 15.8 KB | `scripts/e2e-smoke-test.js` | E2E smoke test pipeline (preserved) |

---

## 4. Generated Files, Caches & Temporary Data Identified

1. **`dist/` (820.57 KB, 6 files)**:
   - Generated build outputs from `vite build` and `esbuild`.
   - Action: Safe to delete before running fresh clean build and creating the delivery package.
2. **`data/uploads/` (3.65 KB, 90 files)**:
   - Dummy image files created during execution of `server/media.test.ts`.
   - Action: Safe to delete. The test suite automatically creates directories and fixtures as needed.
3. **Caches & Temporary Artifacts**:
   - `node_modules/.vite` / `.vite` (if present)
   - Stale pnpm store links from earlier phases (`mermaid`, `cytoscape-fcose`).
   - Action: Safe to delete/prune.

---

## 5. Duplicate and Unused Asset Analysis

- **Public Assets (`client/public`)**:
  - `client/public/meetly-mark.svg` (446 bytes) — active SVG logo used in brand header.
  - `client/public/.gitkeep` (0 bytes).
  - No duplicate images or unreferenced media assets exist in `client/public/`.
- **Legacy Manus Files**:
  - No active Manus files or packages exist. Only an entry in `.gitignore` (`client/public/__manus__/version.json`) and retrospective historical references in documentation remain.
- **Antigravity Temporary Files**:
  - All scratch scripts and logs are isolated inside `<appDataDir>\brain\...`. The workspace `D:\meetly` contains no untracked temporary files or debug artifacts.

---

## 6. Dependency and Package Audit

Comprehensive dependency audit of `package.json` vs all TypeScript/React source files revealed **31 unused packages**:

### A. 40 Unused shadcn UI Scaffolding Files
The following 40 files in `client/src/components/ui/` were scaffolded by shadcn during initial project setup but are **never imported or referenced** anywhere in the application:
1. `accordion.tsx`
2. `alert-dialog.tsx`
3. `alert.tsx`
4. `aspect-ratio.tsx`
5. `avatar.tsx`
6. `badge.tsx`
7. `breadcrumb.tsx`
8. `button-group.tsx`
9. `calendar.tsx`
10. `carousel.tsx`
11. `checkbox.tsx`
12. `collapsible.tsx`
13. `command.tsx`
14. `context-menu.tsx`
15. `drawer.tsx`
16. `dropdown-menu.tsx`
17. `empty.tsx`
18. `field.tsx`
19. `form.tsx`
20. `hover-card.tsx`
21. `input-group.tsx`
22. `input-otp.tsx`
23. `item.tsx`
24. `kbd.tsx`
25. `menubar.tsx`
26. `navigation-menu.tsx`
27. `pagination.tsx`
28. `popover.tsx`
29. `progress.tsx`
30. `radio-group.tsx`
31. `resizable.tsx`
32. `scroll-area.tsx`
33. `select.tsx`
34. `sidebar.tsx`
35. `slider.tsx`
36. `spinner.tsx`
37. `switch.tsx`
38. `table.tsx`
39. `tabs.tsx`
40. `toggle-group.tsx`

### B. Actively Used UI Components (Retained)
The following 12 UI components are actively imported and **must be preserved**:
- `button.tsx`
- `card.tsx`
- `dialog.tsx`
- `input.tsx`
- `label.tsx`
- `separator.tsx`
- `sheet.tsx`
- `skeleton.tsx`
- `sonner.tsx`
- `textarea.tsx`
- `toggle.tsx`
- `tooltip.tsx`

### C. Dependencies Safe to Remove (31 Packages)
Removing the 40 unused UI components allows removing the following 31 unused packages from `package.json`:
1. `@radix-ui/react-accordion`
2. `@radix-ui/react-alert-dialog`
3. `@radix-ui/react-aspect-ratio`
4. `@radix-ui/react-avatar`
5. `@radix-ui/react-checkbox`
6. `@radix-ui/react-collapsible`
7. `@radix-ui/react-context-menu`
8. `@radix-ui/react-dropdown-menu`
9. `@radix-ui/react-hover-card`
10. `@radix-ui/react-menubar`
11. `@radix-ui/react-navigation-menu`
12. `@radix-ui/react-popover`
13. `@radix-ui/react-progress`
14. `@radix-ui/react-radio-group`
15. `@radix-ui/react-scroll-area`
16. `@radix-ui/react-select`
17. `@radix-ui/react-slider`
18. `@radix-ui/react-switch`
19. `@radix-ui/react-tabs`
20. `@radix-ui/react-toggle-group`
21. `cmdk`
22. `embla-carousel-react`
23. `input-otp`
24. `react-day-picker`
25. `date-fns`
26. `react-resizable-panels`
27. `vaul`
28. `framer-motion`
29. `@hookform/resolvers`
30. `tailwindcss-animate`
31. `pnpm` (in `devDependencies` — redundant self-reference)

*Note on `mysql2` and `cookie`:*
- `mysql2` is NOT imported directly in user code, but is required by `drizzle-orm/mysql2` for database operations. It **must be preserved**.
- `cookie` is no longer imported (replaced with native Express cookies and helper in `server/authSession.ts`), safe to remove.

---

## 7. Inspection of `.gitignore` and `.dockerignore`

- `.gitignore`: Well structured, correctly ignores `node_modules`, `dist`, `.env`, `data/uploads`, `coverage`, etc.
- `.dockerignore`: Currently contains only 8 lines. Needs updating to exclude `*.md` reports, test files (`*.test.ts`), `scripts/`, `.vite`, `coverage/`, and local documentation to minimize Docker build context and maximize build performance.

---

## 8. Expected Storage Footprint Reduction

- **In Working Repository (`D:\meetly`)**:
  - Pruning 40 dead UI components and 31 unused dependencies: removes ~140 KB source code and ~2,000+ files / ~40 MB from `node_modules`.
  - Wiping 90 dummy test uploads from `data/uploads`: ~3.65 KB.
  - Cleaning `dist/` before fresh build: eliminates any stale build artifacts.
- **In Source Delivery Package (`meetly-clean-source.zip`)**:
  - Excludes `node_modules/` (466 MB), `.git/` (1.22 MB), `dist/` (820 KB), `data/uploads/`, and `.env`.
  - Delivery package size will shrink from over 560 MB uncompressed to **under 1.5 MB uncompressed** and **under 600 KB compressed ZIP**!
