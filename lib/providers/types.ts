import { TraceResult } from "../parser/types";

export interface ModelProvider {
  id: string;
  name: string;
  execute(prompt: string): Promise<TraceResult>;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  requiresKey: string; // env var name
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Anthropic's reasoning model with extended thinking",
    requiresKey: "ANTHROPIC_API_KEY",
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "deepseek",
    description: "Open-weight reasoning model with full trace exposure",
    requiresKey: "DEEPSEEK_API_KEY",
  },
  {
    id: "o3-mini",
    name: "OpenAI o3-mini",
    provider: "openai",
    description: "OpenAI's compact reasoning model",
    requiresKey: "OPENAI_API_KEY",
  },
];
