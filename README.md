# ThinkDiff

[![CI](https://github.com/kishormorol/thinkdiff/actions/workflows/ci.yml/badge.svg)](https://github.com/kishormorol/thinkdiff/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Compare how LLMs reason.** Submit a single prompt to multiple reasoning models and visualize their thinking processes side-by-side — revealing where they diverge, backtrack, and arrive at answers through fundamentally different cognitive paths.

> Different LLMs don't just give different answers — they *think* differently. ThinkDiff captures the full reasoning trace from each model and turns it into interactive, explorable visualizations.

<p align="center">
  <img src="docs/images/home.png" alt="ThinkDiff home screen: prompt input, example prompts and model selection" width="49%" />
  <img src="docs/images/compare.png" alt="ThinkDiff comparison view: summary cards and structured reasoning phases for Claude Sonnet and DeepSeek R1" width="49%" />
</p>

---

## What It Does

ThinkDiff sends the same prompt to up to **3 reasoning models** simultaneously, captures their extended thinking / chain-of-thought, and gives you several views to analyze how they reason:

### Supported Models

| Model | Provider | Reasoning Method |
|---|---|---|
| **Claude Sonnet 4** | Anthropic | Extended thinking (native) |
| **DeepSeek R1** | DeepSeek | Reasoning content |
| **o3-mini** | OpenAI | Medium-effort reasoning |

### Visualization Modes

Every comparison opens with **summary cards** — fastest model, most token-efficient, most linear (fewest backtracks), and whether the models' final answers agree — plus a pairwise **divergence score**. Below them, five comparison views:

| View | What it shows |
|---|---|
| **Side by Side** | Each model in its own panel, with five tabs (below) |
| **Aligned** | Phases matched across models row by row, so you can see exactly where reasoning diverges |
| **Synced Replay** | All models replay their steps together on one timeline (0.5x–4x), normalized so short and long traces finish together |
| **Compare Stats** | Head-to-head bars for tokens, time, steps, phases and backtracks, plus each model's reasoning style |
| **Answer Diff** | Word-level diff of the final answers |

Each model's panel has five tabs:

| Tab | What it shows |
|---|---|
| **Steps** | Phases and their individual reasoning steps, color-coded by type |
| **Tree** | Interactive graph (pan/zoom): root → phases → steps → answer |
| **Replay** | Animated step-by-step playback with a phase-segmented progress bar |
| **Raw** | The unprocessed reasoning trace |
| **Metrics** | Token counts, timing, phase distribution, backtracks, and reasoning style (Linear / Exploratory / Iterative) |

---

## How It Works

### 1. Input
Enter a prompt or choose from examples (Math, Logic, Code). Select which models to compare. Alternatively, **paste traces manually** from external sources.

### 2. Execute
ThinkDiff calls each model's API in parallel, capturing the full reasoning trace (extended thinking / chain-of-thought) and the final answer.

### 3. Parse & Structure
Raw traces are sent to Claude Haiku, which semantically parses them into a structured hierarchy:

**6 Phase Types** (reasoning chunks):
| Phase | Description | Color |
|---|---|---|
| Understand | Reading/interpreting the problem | Blue |
| Plan | Deciding on an approach | Purple |
| Execute | Carrying out calculations/logic | Green |
| Evaluate | Checking work or alternatives | Yellow |
| Backtrack | Realizing mistake, changing direction | Orange |
| Verify | Confirming final answer | Teal |

**6 Step Types** (individual reasoning statements):
| Step | Icon | Description |
|---|---|---|
| Assertion | → | Stating a fact or result |
| Question | ? | Asking a sub-question |
| Hypothesis | ~ | Proposing a possibility |
| Contradiction | ✕ | Finding an error |
| Conclusion | ✓ | Reaching a result |
| Backtrack | ↩ | Abandoning a line of reasoning |

### 4. Visualize & Compare
Every view renders from the same structured data, so you can explore reasoning patterns from multiple angles.

---

## Divergence Analysis

ThinkDiff computes a **divergence score** (0–150+) between any two traces:

| Score | Classification | Meaning |
|---|---|---|
| 0–29 | Similar | Models reason in roughly the same way |
| 30–79 | Divergent | Notable differences in approach |
| 80+ | Very Different | Fundamentally different reasoning strategies |

**Weighted factors:**
- Backtrack count difference (×30) — most revealing
- Token distribution ratio (×50)
- Phase type distribution (×20)
- Phase count difference (×10)

---

## Getting Started

### Try the Demo (No API Keys)

```bash
git clone https://github.com/kishormorol/thinkdiff.git
cd thinkdiff
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **"Demo — no keys"** to load a pre-recorded math reasoning comparison between Claude Sonnet 4 and DeepSeek R1. The demo traces ship pre-parsed, so every view — Steps, Tree, Replay, Aligned, Synced Replay, Metrics and Answer Diff — works with no API keys.

### Compare Your Own Prompts

Copy the example env file and add your API keys:

```bash
cp .env.example .env.local
```

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
```

You only need keys for the models you want to use — select any combination of 1–3 models. Note that `ANTHROPIC_API_KEY` is also used to parse traces (Claude Haiku), so it's required for live comparisons and Paste Mode.

> ⚠️ **Deploying publicly?** The API routes have no auth or rate limiting, so anyone with the URL can spend your API credits. See [SECURITY.md](SECURITY.md).

### Manual Paste Mode

Compare traces from models ThinkDiff doesn't call directly (e.g. from ChatGPT or Gemini):
1. Get reasoning traces from any source
2. Click **"Paste"** next to the Compare button
3. Paste each model's reasoning trace and answer
4. Click **"Parse & Structure Traces"** to analyze

Parsing uses Claude Haiku, so Paste Mode needs `ANTHROPIC_API_KEY` (but no keys for the pasted models).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Graphs | React Flow (@xyflow/react) |
| State | Zustand |
| Animation | Framer Motion |
| LLM APIs | Anthropic SDK, OpenAI SDK |
| Trace Parsing | Claude Haiku |

---

## Project Structure

```
thinkdiff/
├── app/
│   ├── page.tsx                # Landing page + prompt input
│   ├── compare/page.tsx        # Comparison dashboard
│   └── api/
│       ├── execute/route.ts    # Run models in parallel
│       └── parse/route.ts      # Parse traces with Claude
├── components/
│   ├── prompt-input.tsx        # Input form + model selection
│   ├── comparison-view.tsx     # Main comparison container
│   ├── comparison-summary.tsx  # At-a-glance comparison summary
│   ├── trace-panel.tsx         # Individual trace card (5 tabs)
│   ├── aligned-comparison.tsx  # Cross-model phase alignment
│   ├── answer-diff.tsx         # Final answer diff across models
│   ├── phase-timeline.tsx      # Token distribution bar
│   ├── trace-tree.tsx          # Interactive graph visualization
│   ├── reasoning-replay.tsx    # Animated step playback
│   ├── synced-replay.tsx       # Synchronized multi-model replay
│   ├── cross-metrics.tsx       # Cross-model metric comparison
│   └── metrics-dashboard.tsx   # Stats + charts
├── lib/
│   ├── store.ts                # Zustand state
│   ├── answer.ts               # Final-answer normalization for agreement checks
│   ├── parser/
│   │   ├── types.ts            # Phase, Step, StructuredTrace types
│   │   ├── llm-parser.ts       # Claude-powered trace parser
│   │   ├── structure.ts        # Builds StructuredTrace from parsed phases
│   │   └── alignment.ts        # Phase alignment algorithm
│   └── providers/
│       ├── index.ts            # Provider factory
│       ├── claude.ts           # Claude Sonnet 4
│       ├── deepseek.ts         # DeepSeek R1
│       └── openai.ts           # o3-mini
├── public/examples/            # Demo data (pre-parsed, works without keys)
├── docs/images/                # README screenshots
└── .github/                    # CI workflow, issue/PR templates, Dependabot
```

---

## Use Cases

- **AI research** — Study how different architectures approach the same problem
- **Model selection** — Choose the right model by understanding its reasoning style
- **Education** — Teach students about LLM reasoning, chain-of-thought, and metacognition
- **Debugging** — Find where a model's reasoning goes wrong by tracing its steps
- **Benchmarking** — Compare reasoning efficiency (tokens, backtracks, time) across models

---

## API Routes

### POST `/api/execute`
Execute prompt across selected models. Returns `400` for invalid JSON, an empty prompt, a prompt over 20,000 characters, or an unknown model ID. A model with no API key configured comes back with an `error` field instead of failing the whole request.

```json
// Request
{ "prompt": "string", "models": ["claude-sonnet", "deepseek-r1", "o3-mini"] }

// Response
{ "prompt": "string", "results": [{ "model": "string", "rawTrace": "string", "answer": "string", "totalTokens": 0, "totalTimeMs": 0 }] }
```

### POST `/api/parse`
Parse raw traces into structured phases/steps using Claude Haiku. Requires `ANTHROPIC_API_KEY`; returns `502` if parsing fails.

```json
// Request
{ "prompt": "string", "results": [TraceResult[]] }

// Response
{ "traces": [StructuredTrace[]] }
```

---

## Development

```bash
npm run dev        # start the dev server
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # production build
```

---

## Contributing

Contributions are welcome — new model providers, visualizations, metrics, and bug fixes. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, and a step-by-step guide to adding a provider. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

### Roadmap ideas

- More reasoning models (Gemini, Qwen, local models via Ollama)
- Export comparisons as shareable links or images
- Batch comparisons across a prompt set
- Automated tests for the parser and alignment algorithm

---

## Citation

If you use ThinkDiff in your research, please cite it using the metadata in [CITATION.cff](CITATION.cff) (GitHub's **"Cite this repository"** button generates BibTeX and APA).

---

## License

[MIT](LICENSE) © Md Kishor Morol

Built for the CHI 2027 poster track.
