# Contributing to ThinkDiff

Thanks for your interest in improving ThinkDiff! Bug reports, new model providers, new visualizations, and docs fixes are all welcome.

## Getting set up

```bash
git clone https://github.com/kishormorol/thinkdiff.git
cd thinkdiff
npm install
cp .env.example .env.local   # optional — the demo works without keys
npm run dev
```

Requires Node.js 20.9+ (CI uses the version in `.nvmrc`).

> **Note:** This project uses Next.js 16, which has breaking changes from earlier versions. Check `node_modules/next/dist/docs/` before relying on older Next.js patterns.

## Before you open a PR

```bash
npm run lint
npm run typecheck
npm run build
```

CI runs the same three checks on every pull request.

- Keep PRs focused — one feature or fix per PR.
- For UI changes, include a screenshot or short GIF.
- For larger changes (new visualization modes, changes to the parser schema), open an issue first so we can agree on the approach.
- Never commit API keys. `.env*` files are git-ignored except `.env.example`.

## Adding a new model provider

1. Create `lib/providers/<name>.ts` implementing `ModelProvider` (see `lib/providers/types.ts`). `execute(prompt)` must return a `TraceResult` with the raw reasoning in `rawTrace` and the final answer in `answer`.
2. Register it in `getProvider()` in `lib/providers/index.ts`, reading its key from an environment variable.
3. Add an entry to `MODEL_OPTIONS` in `lib/providers/types.ts` so it shows up in the UI and passes API validation.
4. Add the env var to `.env.example` and the model to the README's *Supported Models* table.

## Adding a visualization

Visualizations read `StructuredTrace` objects (`lib/parser/types.ts`) from the Zustand store (`lib/store.ts`). Add a component under `components/` and wire it into `components/comparison-view.tsx` or `components/trace-panel.tsx`. The demo data in `public/examples/` is the easiest way to iterate without API keys.

## Commit messages

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

## Code of Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
