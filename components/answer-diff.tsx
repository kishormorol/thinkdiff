"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { StructuredTrace } from "@/lib/parser/types";
import { answerKey } from "@/lib/answer";

const MODEL_COLORS: Record<string, string> = {
  "claude-sonnet": "#818cf8",
  "deepseek-r1": "#34d399",
  "o3-mini": "#f59e0b",
};

function modelColor(model: string): string {
  return MODEL_COLORS[model] ?? "#818cf8";
}

interface AnswerDiffProps {
  traces: StructuredTrace[];
}

/**
 * Simple word-level diff between two strings.
 * Returns an array of segments with type: same | added | removed.
 */
function diffWords(
  a: string,
  b: string
): { text: string; type: "same" | "added" | "removed" }[] {
  const wordsA = a.split(/(\s+)/);
  const wordsB = b.split(/(\s+)/);

  // Simple LCS-based diff
  const m = wordsA.length;
  const n = wordsB.length;

  // For very long texts, fall back to simple comparison
  if (m * n > 100000) {
    if (a === b) return [{ text: a, type: "same" }];
    return [
      { text: a, type: "removed" },
      { text: b, type: "added" },
    ];
  }

  // LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: { text: string; type: "same" | "added" | "removed" }[] = [];
  let i = m;
  let j = n;
  const segments: { text: string; type: "same" | "added" | "removed" }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
      segments.push({ text: wordsA[i - 1], type: "same" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      segments.push({ text: wordsB[j - 1], type: "added" });
      j--;
    } else {
      segments.push({ text: wordsA[i - 1], type: "removed" });
      i--;
    }
  }

  segments.reverse();

  // Merge consecutive same-type segments
  for (const seg of segments) {
    if (result.length > 0 && result[result.length - 1].type === seg.type) {
      result[result.length - 1].text += seg.text;
    } else {
      result.push({ ...seg });
    }
  }

  return result;
}

export function AnswerDiff({ traces }: AnswerDiffProps) {
  const answers = traces.map((t) => ({
    model: t.model,
    answer: t.answer,
  }));

  // Check agreement
  const normalized = answers.map((a) => answerKey(a.answer));
  const allAgree = normalized.every((a) => a === normalized[0]);

  // Compute diffs between pairs
  const diffs = useMemo(() => {
    const pairs: {
      a: string;
      b: string;
      segments: { text: string; type: "same" | "added" | "removed" }[];
    }[] = [];

    for (let i = 0; i < answers.length; i++) {
      for (let j = i + 1; j < answers.length; j++) {
        pairs.push({
          a: answers[i].model,
          b: answers[j].model,
          segments: diffWords(answers[i].answer, answers[j].answer),
        });
      }
    }
    return pairs;
  }, [answers]);

  return (
    <div className="space-y-5">
      {/* Agreement status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div
          className="glass rounded-xl px-5 py-3 flex items-center gap-3"
          style={{
            boxShadow: allAgree
              ? "0 0 20px rgba(16,185,129,0.1)"
              : "0 0 20px rgba(239,68,68,0.1)",
          }}
        >
          <span
            className="text-lg"
            style={{ color: allAgree ? "#10b981" : "#ef4444" }}
          >
            {allAgree ? "✓" : "✕"}
          </span>
          <span className="text-sm font-medium" style={{ color: allAgree ? "#6ee7b7" : "#fca5a5" }}>
            {allAgree
              ? "All models agree on the answer"
              : "Models produced different answers"}
          </span>
        </div>
      </motion.div>

      {/* Individual answers */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${traces.length}, 1fr)`,
        }}
      >
        {answers.map((a, i) => {
          const color = modelColor(a.model);
          return (
            <motion.div
              key={a.model}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl overflow-hidden"
            >
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{
                  background: `${color}08`,
                  borderBottom: `1px solid ${color}20`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color }}
                >
                  {a.model}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                  {a.answer}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Word-level diffs for each pair */}
      {!allAgree && diffs.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase text-center">
            Word-Level Differences
          </p>
          {diffs.map((pair, pi) => {
            const hasDiff = pair.segments.some((s) => s.type !== "same");
            if (!hasDiff) return null;

            return (
              <motion.div
                key={`${pair.a}-${pair.b}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + pi * 0.1 }}
                className="glass rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: modelColor(pair.a) }}
                  >
                    {pair.a}
                  </span>
                  <span className="text-muted-foreground/30">vs</span>
                  <span
                    className="font-mono font-semibold"
                    style={{ color: modelColor(pair.b) }}
                  >
                    {pair.b}
                  </span>
                </div>

                <div className="text-sm leading-relaxed">
                  {pair.segments.map((seg, si) => {
                    if (seg.type === "same") {
                      return (
                        <span key={si} className="text-foreground/50">
                          {seg.text}
                        </span>
                      );
                    }
                    if (seg.type === "removed") {
                      return (
                        <span
                          key={si}
                          className="rounded px-0.5"
                          style={{
                            background: "rgba(239,68,68,0.15)",
                            color: "#fca5a5",
                            textDecoration: "line-through",
                          }}
                        >
                          {seg.text}
                        </span>
                      );
                    }
                    return (
                      <span
                        key={si}
                        className="rounded px-0.5"
                        style={{
                          background: "rgba(16,185,129,0.15)",
                          color: "#6ee7b7",
                        }}
                      >
                        {seg.text}
                      </span>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] pt-2 border-t border-[oklch(0.2_0.02_260_/_30%)]">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-3 h-2 rounded-sm"
                      style={{ background: "rgba(239,68,68,0.15)" }}
                    />
                    <span className="text-muted-foreground/50">
                      Only in {pair.a}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="w-3 h-2 rounded-sm"
                      style={{ background: "rgba(16,185,129,0.15)" }}
                    />
                    <span className="text-muted-foreground/50">
                      Only in {pair.b}
                    </span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
