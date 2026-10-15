# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Open-source project files: LICENSE, CONTRIBUTING, Code of Conduct, Security policy, issue/PR templates, CITATION.cff.
- GitHub Actions CI (lint, typecheck, build) and Dependabot.
- `.env.example` and `npm run typecheck`.
- Request validation for `/api/execute` (known models, prompt length) and error handling for `/api/parse`.

### Fixed
- Lint errors in replay components (setState in effect) and the metrics donut chart (variable reassigned during render).

## [0.1.0]

### Added
- Side-by-side, aligned, tree, replay and metrics views for comparing reasoning traces.
- Synced replay, cross-model metrics, answer diff and comparison summary.
- Providers for Claude Sonnet 4, DeepSeek R1 and o3-mini; Claude Haiku–based trace parser.
