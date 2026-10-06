import OpenAI from "openai";
import { TraceResult } from "../parser/types";
import { ModelProvider } from "./types";

export class DeepSeekProvider implements ModelProvider {
  id = "deepseek-r1";
  name = "DeepSeek R1";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });
  }

  async execute(prompt: string): Promise<TraceResult> {
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [{ role: "user", content: prompt }],
    });

    const elapsed = Date.now() - start;
    const choice = response.choices[0];

    return {
      model: this.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawTrace: ((choice.message as any).reasoning_content ?? "").trim(),
      answer: (choice.message.content ?? "").trim(),
      totalTokens:
        (response.usage?.prompt_tokens ?? 0) +
        (response.usage?.completion_tokens ?? 0),
      totalTimeMs: elapsed,
    };
  }
}
