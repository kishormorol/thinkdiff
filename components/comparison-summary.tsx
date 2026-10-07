"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { StructuredTrace, PhaseType } from "@/lib/parser/types";
import { divergenceScore } from "@/lib/parser/alignment";

const MODEL_COLORS: Record<string, string> = {
  "claude-sonnet": "#818cf8",
  "deepseek-r1": "#34d399",
  "o3-mini": "#f59e0b",
};

function modelColor(model: string): string {
  return MODEL_COLORS[model] ?? "#818cf8";
}

interface ComparisonSummaryProps {
  traces: StructuredTrace[];
}

export function ComparisonSummary({ traces }: ComparisonSummaryProps) {
  const stats = useMemo(() => {
    const fastest = [...traces].sort((a, b) => a.totalTimeMs - b.totalTimeMs)[0];
    const fewestTokens = [...traces].sort((a, b) => a.totalTokens - b.totalTokens)[0];
    const mostBacktracks = [...traces].sort(
      (a, b) =>
        b.phases.filter((p) => p.type === "backtrack").length -
        a.phases.filter((p) => p.type === "backtrack").length
    )[0];
    const leastBacktracks = [...traces].sort(
      (a, b) =>
        a.phases.filter((p) => p.type === "backtrack").length -
        b.phases.filter((p) => p.type === "backtrack").length
    )[0];

    // Answer agreement
    const answers = traces.map((t) => t.answer.trim().toLowerCase());
    const allAgree = answers.every((a) => a === answers[0]);
    const answerGroups = new Map<string, string[]>();
    traces.forEach((t) => {
      const key = t.answer.trim().toLowerCase().slice(0, 100);
      const existing = answerGroups.get(key) ?? [];
      existing.push(t.model);
      answerGroups.set(key, existing);
    });

    // Divergence between pairs
    const divScores: { a: string; b: string; score: number }[] = [];
    for (let i = 0; i < traces.length; i++) {
      for (let j = i + 1; j < traces.length; j++) {
        divScores.push({
          a: traces[i].model,
          b: traces[j].model,
          score: divergenceScore(traces[i], traces[j]),
        });
      }
    }

    return {
      fastest,
      fewestTokens,
      mostBacktracks,
      leastBacktracks,
      allAgree,
      answerGroups,
      divScores,
    };
  }, [traces]);

  const cards = [
    {
      label: "Fastest",
      value: stats.fastest.model,
      detail: `${(stats.fastest.totalTimeMs / 1000).toFixed(1)}s`,
      color: modelColor(stats.fastest.model),
      icon: "⚡",
    },
    {
      label: "Most Efficient",
      value: stats.fewestTokens.model,
      detail: `${stats.fewestTokens.totalTokens.toLocaleString()} tokens`,
      color: modelColor(stats.fewestTokens.model),
      icon: "◎",
    },
    {
      label: "Most Linear",
      value: stats.leastBacktracks.model,
      detail: `${stats.leastBacktracks.phases.filter((p) => p.type === "backtrack").length} backtracks`,
      color: modelColor(stats.leastBacktracks.model),
      icon: "→",
    },
    {
      label: "Answers",
      value: stats.allAgree ? "Agree" : "Differ",
      detail: stats.allAgree
        ? "All models reached the same answer"
        : `${stats.answerGroups.size} distinct answers`,
      color: stats.allAgree ? "#10b981" : "#ef4444",
      icon: stats.allAgree ? "✓" : "✕",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-xl p-4 space-y-2"
            style={{
              boxShadow: `0 0 20px ${card.color}08, inset 0 0 15px ${card.color}03`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{card.icon}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                {card.label}
              </span>
            </div>
            <p className="text-sm font-mono font-semibold" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="text-[10px] text-muted-foreground/50">{card.detail}</p>
          </motion.div>
        ))}
      </div>

      {/* Divergence pairs */}
      {stats.divScores.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          {stats.divScores.map((d) => {
            const level =
              d.score < 30 ? "Similar" : d.score < 80 ? "Divergent" : "Very Different";
            const color =
              d.score < 30 ? "#10b981" : d.score < 80 ? "#f59e0b" : "#ef4444";
            return (
              <div
                key={`${d.a}-${d.b}`}
                className="glass rounded-lg px-3 py-2 flex items-center gap-3 text-xs"
              >
                <span className="font-mono" style={{ color: modelColor(d.a) }}>
                  {d.a}
                </span>
                <span className="text-muted-foreground/30">vs</span>
                <span className="font-mono" style={{ color: modelColor(d.b) }}>
                  {d.b}
                </span>
                <div className="w-16 h-1.5 rounded-full bg-[oklch(0.12_0.01_260)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(d.score, 150) / 1.5}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="h-full rounded-full"
                    style={{
                      background: color,
                      boxShadow: `0 0 6px ${color}40`,
                    }}
                  />
                </div>
                <span className="font-semibold" style={{ color }}>
                  {level}
                </span>
                <span className="font-mono text-muted-foreground/30">{d.score}</span>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
