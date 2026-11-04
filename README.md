<div align="center">
  <h1>libreadest</h1>
  <p>A libre, local-first fork of <a href="https://github.com/readest/readest">Readest</a>.</p>
</div>

libreadest is an ebook reader for desktop, mobile and the web. It is built from
the Readest codebase with the hosted service removed: there are no accounts, no
subscriptions and no premium features. Your library, reading progress,
annotations, translations and text-to-speech stay on your device, and the AI
assistant talks to an API you configure yourself.

## What changed in this fork

- **No accounts.** Supabase sign-in, the account page, Readest Cloud, hosted
  storage, share links, "Send to Readest" and the hosted Readest Voice catalog
  are gone.
- **No premium gating.** Every remaining feature is available to every user.
- **Your own AI API.** Settings → AI takes an OpenAI-compatible base URL, API
  key and model names; requests go straight from your device to that endpoint.
  A local Ollama server is also supported.
- **Local features kept.** Library management, EPUB/MOBI/AZW3/PDF/FB2 reading,
  annotations, OPDS catalogs, KOReader sync, Audiobookshelf, LocalSend,
  Readwise/Hardcover/Notion export, and user-configured WebDAV, S3, Google
  Drive, OneDrive and iCloud sync.
- **Self-built.** Builds come from this repository's GitHub Actions workflow;
  the upstream auto-updater is disabled.

## Development

Requirements: Node 24, pnpm 11.1.1, Rust >= 1.90 (Linux CEF desktop builds need
>= 1.95).

```bash
git submodule update --init --recursive
pnpm install
pnpm --filter @readest/readest-app setup-vendors
pnpm dev-web        # web app
pnpm tauri dev      # desktop app
```

Tests and checks:

```bash
pnpm test           # unit tests
pnpm lint           # tsc --noEmit + Biome
pnpm fmt:check      # Rust formatting
```

See [AGENTS.md](AGENTS.md) and [apps/readest-app/AGENTS.md](apps/readest-app/AGENTS.md)
for the full contributor notes.

## License

AGPL-3.0, the same license as upstream Readest. See [LICENSE](LICENSE).
libreadest is not affiliated with or endorsed by the Readest project.
