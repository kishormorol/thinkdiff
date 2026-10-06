import Anthropic from "@anthropic-ai/sdk";
import { TraceResult } from "../parser/types";
import { ModelProvider } from "./types";

export class ClaudeProvider implements ModelProvider {
  id = "claude-sonnet";
  name = "Claude Sonnet 4";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async execute(prompt: string): Promise<TraceResult> {
    const start = Date.now();

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      thinking: {
        type: "enabled",
        budget_tokens: 10000,
      },
      messages: [{ role: "user", content: prompt }],
    });

    const elapsed = Date.now() - start;

    let rawTrace = "";
    let answer = "";

    for (const block of response.content) {
      if (block.type === "thinking") {
        rawTrace += block.thinking + "\n";
      } else if (block.type === "text") {
        answer += block.text;
      }
    }

    return {
      model: this.id,
      rawTrace: rawTrace.trim(),
      answer: answer.trim(),
      totalTokens:
        (response.usage?.input_tokens ?? 0) +
        (response.usage?.output_tokens ?? 0),
      totalTimeMs: elapsed,
    };
  }
}
