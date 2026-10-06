import OpenAI from "openai";
import { TraceResult } from "../parser/types";
import { ModelProvider } from "./types";

export class OpenAIProvider implements ModelProvider {
  id = "o3-mini";
  name = "OpenAI o3-mini";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async execute(prompt: string): Promise<TraceResult> {
    const start = Date.now();

    const response = await this.client.responses.create({
      model: "o3-mini",
      input: prompt,
      reasoning: { effort: "medium", summary: "detailed" },
    });

    const elapsed = Date.now() - start;

    let rawTrace = "";
    let answer = "";

    for (const item of response.output) {
      if (item.type === "reasoning" && "summary" in item) {
        for (const s of item.summary ?? []) {
          if (s.type === "summary_text") {
            rawTrace += s.text + "\n";
          }
        }
      } else if (item.type === "message") {
        for (const c of item.content) {
          if (c.type === "output_text") {
            answer += c.text;
          }
        }
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
