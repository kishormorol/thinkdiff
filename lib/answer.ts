/**
 * Reduces a model's answer to a comparable key so that answers with the same
 * result but different explanations count as agreeing. Prefers the first
 * **bold** span (models usually bold the final result), then falls back to
 * the whole answer, lowercased with whitespace and punctuation collapsed.
 */
export function answerKey(answer: string): string {
  const bold = answer.match(/\*\*(.+?)\*\*/);
  const core = bold ? bold[1] : answer;
  return core
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .replace(/\.(?!\d)/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
