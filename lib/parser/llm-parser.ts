import Anthropic from "@anthropic-ai/sdk";
import { StructuredTrace, TraceResult } from "./types";
import { buildStructuredTrace, RawPhase } from "./structure";

const PARSE_PROMPT = `You are a reasoning trace analyzer. Given a raw reasoning trace from an LLM, parse it into structured phases and steps.

Output a JSON object with this exact schema:
{
  "phases": [
    {
      "label": "string - human readable label like 'Understanding the problem'",
      "type": "understand" | "plan" | "execute" | "evaluate" | "backtrack" | "verify",
      "steps": [
        {
          "content": "string - the actual reasoning text for this step",
          "type": "assertion" | "question" | "hypothesis" | "contradiction" | "conclusion" | "backtrack"
        }
      ]
    }
  ]
}

Phase type guide:
- understand: reading/interpreting the problem
- plan: deciding on an approach
- execute: carrying out calculations or logic
- evaluate: checking work or considering alternatives
- backtrack: realizing a mistake and changing direction
- verify: confirming the final answer

Step type guide:
- assertion: stating a fact or intermediate result
- question: asking a sub-question
- hypothesis: proposing a possibility
- contradiction: finding an error or inconsistency
- conclusion: reaching a result
- backtrack: abandoning a line of reasoning

Rules:
1. Every piece of the reasoning trace must be captured in some step
2. Group consecutive related thoughts into the same phase
3. Mark backtracking clearly — this is crucial for the visualization
4. Keep step content concise but faithful to the original text
5. Output ONLY valid JSON, no markdown fences`;

export async function parseTrace(
  rawResult: TraceResult,
  prompt: string,
  apiKey: string
): Promise<StructuredTrace> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${PARSE_PROMPT}\n\n<prompt>${prompt}</prompt>\n\n<reasoning_trace>\n${rawResult.rawTrace}\n</reasoning_trace>`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let parsed: { phases: RawPhase[] };
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: treat entire trace as a single phase
    parsed = {
      phases: [
        {
          label: "Reasoning",
          type: "execute",
          steps: [{ content: rawResult.rawTrace, type: "assertion" }],
        },
      ],
    };
  }

  return buildStructuredTrace(rawResult, prompt, parsed.phases);
}

