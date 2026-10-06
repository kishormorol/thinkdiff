export type PhaseType =
  | "understand"
  | "plan"
  | "execute"
  | "evaluate"
  | "backtrack"
  | "verify";

export type StepType =
  | "assertion"
  | "question"
  | "hypothesis"
  | "contradiction"
  | "conclusion"
  | "backtrack";

export interface ReasoningStep {
  id: string;
  content: string;
  type: StepType;
  confidence?: number;
  references?: string[];
  parentId?: string;
}

export interface Phase {
  id: string;
  label: string;
  type: PhaseType;
  steps: ReasoningStep[];
  tokenCount: number;
  startIndex: number;
  endIndex: number;
}

export interface StructuredTrace {
  id: string;
  model: string;
  prompt: string;
  rawTrace: string;
  totalTokens: number;
  totalTimeMs: number;
  phases: Phase[];
  answer: string;
  correct?: boolean;
}

export interface TraceResult {
  model: string;
  rawTrace: string;
  answer: string;
  totalTokens: number;
  totalTimeMs: number;
  error?: string;
}

export interface ComparisonSession {
  id: string;
  prompt: string;
  createdAt: string;
  traces: StructuredTrace[];
}
