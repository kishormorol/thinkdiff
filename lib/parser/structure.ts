import { StructuredTrace, TraceResult, Phase, PhaseType, StepType } from "./types";

export interface RawPhase {
  label: string;
  type: string;
  steps: { content: string; type: string }[];
}

/**
 * Turns parsed phases (from the LLM parser, or pre-parsed demo data) into a
 * StructuredTrace with ids, token estimates and character offsets.
 * Pure and dependency-free so it can run on the client.
 */
export function buildStructuredTrace(
  rawResult: TraceResult,
  prompt: string,
  rawPhases: RawPhase[]
): StructuredTrace {
  let charIndex = 0;
  const phases: Phase[] = rawPhases.map((p, pi) => {
    const steps = (p.steps || []).map((s, si) => ({
      id: `${pi}-${si}`,
      content: s.content,
      type: (s.type || "assertion") as StepType,
    }));

    const phaseText = steps.map((s) => s.content).join(" ");
    const tokenEstimate = Math.ceil(phaseText.length / 4);
    const startIndex = charIndex;
    charIndex += phaseText.length;

    return {
      id: `phase-${pi}`,
      label: p.label || `Phase ${pi + 1}`,
      type: (p.type || "execute") as PhaseType,
      steps,
      tokenCount: tokenEstimate,
      startIndex,
      endIndex: charIndex,
    };
  });

  return {
    id: `${rawResult.model}-${Date.now()}`,
    model: rawResult.model,
    prompt,
    rawTrace: rawResult.rawTrace,
    totalTokens: rawResult.totalTokens,
    totalTimeMs: rawResult.totalTimeMs,
    phases,
    answer: rawResult.answer,
  };
}
