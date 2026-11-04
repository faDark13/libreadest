# AGENTS.md

Readest is a pnpm monorepo ebook reader: a Next.js 16 + Tauri v2 app in
`apps/readest-app/` and a Rust backend in `apps/readest-app/src-tauri/`.
Web deploys through OpenNext/Cloudflare; desktop and mobile use Tauri.

The app-level [AGENTS.md](apps/readest-app/AGENTS.md) (also `CLAUDE.md`),
[.claude/rules/](apps/readest-app/.claude/rules/), [LESSONS.md](apps/readest-app/LESSONS.md),
and [DESIGN.md](apps/readest-app/DESIGN.md) are the detailed sources of truth.
Read them before changing app code; [docs/testing.md](apps/readest-app/docs/testing.md)
explains the test tiers.

## Setup

- Node 24 and pnpm 11.1.1 (`packageManager`). Cargo needs Rust >= 1.90; the
  Linux CEF desktop build needs >= 1.95.
- Fresh clone: `git submodule update --init --recursive && pnpm install &&
  pnpm --filter @readest/readest-app setup-vendors`. Re-run `setup-vendors`
  after submodule or dependency changes; it populates `public/vendor/`.
- Create worktrees with `pnpm worktree:new <branch|pr-number>`; never
  `git worktree add` directly. The script initializes submodules, dependencies,
  env files, vendors, and Tauri gen symlinks.

## Commands

Root shortcuts: `pnpm dev-web`, `pnpm tauri ...`, `pnpm test`, `pnpm lint`,
`pnpm format`, `pnpm format:check`, `pnpm fmt:check`, `pnpm clippy:check`.

Some scripts exist only in `apps/readest-app/package.json`; run those from that
directory: `pnpm build`, `pnpm build-web`, `pnpm test:browser`, `pnpm test:tauri`,
`pnpm test:android`, `pnpm test:rust`, `pnpm test:e2e`, `pnpm test:e2e:web`,
`pnpm i18n:extract`, `pnpm setup-vendors`.

- `pnpm test` is the app unit suite. Focus one file with
  `cd apps/readest-app && pnpm test --run src/__tests__/...` — do not add `--`.
  The suite caps workers at 4; use `--maxWorkers=2` on a slow machine.
- Choose the test tier by filename: `*.test.ts` (jsdom),
  `*.browser.test.ts` (real Chromium), `*.tauri.test.ts` (Tauri IPC),
  `*.android.test.ts` (adb device), and `e2e/**/*.e2e.ts` (WDIO).
- `pnpm lint` = `tsc --noEmit` + Biome. `pnpm format:check` is Biome;
  `pnpm fmt:check` is Rust. They are not interchangeable.
- `pnpm test:tauri` starts its own Next dev server and WebDriver-enabled Tauri
  app (port 4445). `pnpm test:e2e` (WDIO) does need `pnpm tauri:dev:test`
  running; `pnpm test:android` needs an adb device with the dev APK installed.
- Verification: unit + lint for app changes; add `pnpm test:rust`,
  `pnpm fmt:check`, and `pnpm clippy:check` when `src-tauri/` changes; add
  `pnpm lint:lua` and `pnpm test:lua` when `apps/readest.koplugin/` changes.

## Toolchain gotchas

- Next.js 16 here differs from training data. Read `node_modules/next/dist/docs/`
  before changing Next APIs.
- `NEXT_PUBLIC_APP_PLATFORM` selects the build: `tauri` (`out/` static export;
  `.ts` API routes are excluded) or `web` (server/API routes). Scripts load
  `.env.tauri` or `.env.web` through dotenv; don't assume `.env`.
- Desktop builds must not depend on `src/app/api/` or `src/pages/api/`; those
  routes do not exist in the Tauri export.
- On Linux, desktop `pnpm tauri dev|build|bundle` builds the CEF runtime, not
  wry, and swaps `Cargo.lock` with `Cargo.cef.lock`. Never run two CEF builds
  in one checkout. After a killed build: `mv Cargo.lock.wry Cargo.lock`.
- The Rust package is `Readest` (capital R); use `-p Readest`. The root Cargo
  workspace includes only `src-tauri`; `packages/tauri` is excluded and patched
  in, so don't add it as a workspace member.
- `src-tauri/gen/android/` is partially tracked. Regenerate it with
  `pnpm tauri android init` and restore tracked customizations; don't hand-edit
  generated files. `public/vendor/`, `out/`, and `.next/` are generated.
- Every UI change must work under `[data-eink='true']`; reuse `eink-bordered`
  and `btn-contrast` rather than adding new e-ink styles.
- i18n keys are English content. See [docs/i18n.md](apps/readest-app/docs/i18n.md);
  use `stubTranslation` outside React and run `pnpm i18n:extract` (from the app
  directory) for new keys.
- `.github/workflows/pull-request.yml` is the PR gate. `release.yml` and
  `nightly.yml` need signing/store/R2 secrets and publish upstream artifacts;
  don't run them for local verification.
