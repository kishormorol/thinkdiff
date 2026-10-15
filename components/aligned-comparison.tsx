"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { StructuredTrace, PhaseType } from "@/lib/parser/types";
import { alignTraces, divergenceScore } from "@/lib/parser/alignment";
import { ScrollArea } from "@/components/ui/scroll-area";

const PHASE_COLORS: Record<PhaseType, string> = {
  understand: "#3b82f6",
  plan: "#8b5cf6",
  execute: "#10b981",
  evaluate: "#f59e0b",
  backtrack: "#ef4444",
  verify: "#06b6d4",
};

interface AlignedComparisonProps {
  traces: StructuredTrace[];
}

export function AlignedComparison({ traces }: AlignedComparisonProps) {
  const aligned = useMemo(() => alignTraces(traces), [traces]);
  const divScore = useMemo(() => {
    if (traces.length < 2) return 0;
    return divergenceScore(traces[0], traces[1]);
  }, [traces]);

  return (
    <div className="space-y-5">
      {/* Divergence score */}
      {traces.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-4"
        >
          <DivergenceMeter score={divScore} />
        </motion.div>
      )}

      {/* Model headers */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `100px repeat(${traces.length}, 1fr)`,
        }}
      >
        <div />
        {traces.map((t) => (
          <div key={t.id} className="text-center">
            <span className="text-sm font-mono font-semibold text-foreground/80">
              {t.model}
            </span>
            <p className="text-xs text-muted-foreground/50 font-mono">
              {t.totalTokens.toLocaleString()} tok · {(t.totalTimeMs / 1000).toFixed(1)}s
            </p>
          </div>
        ))}
      </div>

      {/* Aligned rows */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-2 pr-4">
          {aligned.map((row, ri) => {
            const hasGap = row.phases.some((p) => p === null);
            const color = PHASE_COLORS[row.type];

            return (
              <motion.div
                key={ri}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ri * 0.05 }}
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `100px repeat(${traces.length}, 1fr)`,
                }}
              >
                {/* Phase label */}
                <div className="flex items-start pt-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
                    style={{
                      color,
                      background: `${color}10`,
                      border: `1px solid ${color}25`,
                    }}
                  >
                    {row.label}
                  </span>
                </div>

                {/* Phase cells */}
                {row.phases.map((phase, pi) => (
                  <div
                    key={pi}
                    className="rounded-xl p-3 text-xs transition-all"
                    style={
                      phase === null
                        ? {
                            background: "rgba(15,15,30,0.3)",
                            border: "1px dashed rgba(100,100,140,0.15)",
                          }
                        : {
                            background: `${color}06`,
                            border: `1px solid ${color}${hasGap && phase !== null ? "40" : "15"}`,
                            boxShadow:
                              hasGap && phase !== null
                                ? `0 0 15px ${color}10`
                                : undefined,
                          }
                    }
                  >
                    {phase === null ? (
                      <span className="text-muted-foreground/20 italic text-xs flex items-center justify-center h-full">
                        —
                      </span>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="font-mono text-xs" style={{ color: `${color}80` }}>
                          {phase.tokenCount} tok · {phase.steps.length} steps
                        </div>
                        {phase.steps.slice(0, 3).map((step) => (
                          <div
                            key={step.id}
                            className="text-sm leading-relaxed line-clamp-2 text-foreground/60"
                          >
                            <span className="font-mono mr-1" style={{ color: `${color}60` }}>
                              {step.type === "backtrack"
                                ? "↩"
                                : step.type === "conclusion"
                                  ? "✓"
                                  : step.type === "question"
                                    ? "?"
                                    : "→"}
                            </span>
                            {step.content}
                          </div>
                        ))}
                        {phase.steps.length > 3 && (
                          <div className="text-xs text-muted-foreground/30 italic">
                            +{phase.steps.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function DivergenceMeter({ score }: { score: number }) {
  const level =
    score < 30 ? "Similar" : score < 80 ? "Divergent" : "Very Different";
  const color =
    score < 30 ? "#10b981" : score < 80 ? "#f59e0b" : "#ef4444";
  const width = Math.min(score, 150) / 1.5;

  return (
    <div className="glass rounded-xl px-5 py-3 flex items-center gap-4">
      <span className="text-xs uppercase tracking-widest text-muted-foreground/50">
        Divergence
      </span>
      <div className="w-32 h-2 rounded-full bg-[oklch(0.12_0.01_260)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {level}
      </span>
      <span className="text-xs font-mono text-muted-foreground/40">
        {score}
      </span>
    </div>
  );
}
