import { ModelProvider } from "./types";
import { ClaudeProvider } from "./claude";
import { DeepSeekProvider } from "./deepseek";
import { OpenAIProvider } from "./openai";

export function getProvider(modelId: string): ModelProvider | null {
  switch (modelId) {
    case "claude-sonnet": {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return null;
      return new ClaudeProvider(key);
    }
    case "deepseek-r1": {
      const key = process.env.DEEPSEEK_API_KEY;
      if (!key) return null;
      return new DeepSeekProvider(key);
    }
    case "o3-mini": {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return null;
      return new OpenAIProvider(key);
    }
    default:
      return null;
  }
}
