"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { StructuredTrace, PhaseType } from "@/lib/parser/types";

const PHASE_COLORS: Record<PhaseType, string> = {
  understand: "#3b82f6",
  plan: "#8b5cf6",
  execute: "#10b981",
  evaluate: "#f59e0b",
  backtrack: "#ef4444",
  verify: "#06b6d4",
};

const PHASE_LABELS: Record<PhaseType, string> = {
  understand: "Understand",
  plan: "Plan",
  execute: "Execute",
  evaluate: "Evaluate",
  backtrack: "Backtrack",
  verify: "Verify",
};

const MODEL_COLORS: Record<string, string> = {
  "claude-sonnet": "#818cf8",
  "deepseek-r1": "#34d399",
  "o3-mini": "#f59e0b",
};

function modelColor(model: string): string {
  return MODEL_COLORS[model] ?? "#818cf8";
}

interface CrossMetricsProps {
  traces: StructuredTrace[];
}

export function CrossMetrics({ traces }: CrossMetricsProps) {
  const data = useMemo(() => {
    const maxTokens = Math.max(...traces.map((t) => t.totalTokens));
    const maxTime = Math.max(...traces.map((t) => t.totalTimeMs));
    const maxSteps = Math.max(
      ...traces.map((t) => t.phases.reduce((n, p) => n + p.steps.length, 0))
    );
    const maxPhases = Math.max(...traces.map((t) => t.phases.length));

    // Phase distributions for all traces
    const allPhaseTypes = new Set<PhaseType>();
    const distributions = traces.map((t) => {
      const dist: Record<PhaseType, number> = {} as Record<PhaseType, number>;
      let total = 0;
      for (const p of t.phases) {
        dist[p.type] = (dist[p.type] || 0) + p.tokenCount;
        total += p.tokenCount;
        allPhaseTypes.add(p.type);
      }
      // Normalize
      for (const k of Object.keys(dist) as PhaseType[]) {
        dist[k] = total > 0 ? dist[k] / total : 0;
      }
      return dist;
    });

    // Reasoning styles
    const styles = traces.map((t) => {
      const bt = t.phases.filter((p) => p.type === "backtrack").length;
      return {
        model: t.model,
        style: bt === 0 ? "Linear" : bt <= 2 ? "Exploratory" : "Iterative",
        color: bt === 0 ? "#10b981" : bt <= 2 ? "#f59e0b" : "#ef4444",
        backtracks: bt,
      };
    });

    return {
      maxTokens,
      maxTime,
      maxSteps,
      maxPhases,
      distributions,
      allPhaseTypes: Array.from(allPhaseTypes),
      styles,
    };
  }, [traces]);

  return (
    <div className="space-y-6">
      {/* Head-to-head bars */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-5 space-y-5"
      >
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-4">
          Head-to-Head
        </p>

        <CompareBar
          label="Tokens"
          traces={traces}
          getValue={(t) => t.totalTokens}
          formatValue={(v) => v.toLocaleString()}
          max={data.maxTokens}
          delay={0}
        />
        <CompareBar
          label="Time"
          traces={traces}
          getValue={(t) => t.totalTimeMs}
          formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
          max={data.maxTime}
          delay={0.1}
        />
        <CompareBar
          label="Steps"
          traces={traces}
          getValue={(t) => t.phases.reduce((n, p) => n + p.steps.length, 0)}
          formatValue={(v) => `${v}`}
          max={data.maxSteps}
          delay={0.2}
        />
        <CompareBar
          label="Phases"
          traces={traces}
          getValue={(t) => t.phases.length}
          formatValue={(v) => `${v}`}
          max={data.maxPhases}
          delay={0.3}
        />
        <CompareBar
          label="Backtracks"
          traces={traces}
          getValue={(t) => t.phases.filter((p) => p.type === "backtrack").length}
          formatValue={(v) => `${v}`}
          max={Math.max(...traces.map((t) => t.phases.filter((p) => p.type === "backtrack").length), 1)}
          delay={0.4}
          accentColor="#ef4444"
        />
      </motion.div>

      {/* Reasoning style comparison */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-5"
      >
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-4">
          Reasoning Style
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${traces.length}, 1fr)` }}>
          {data.styles.map((s, i) => (
            <motion.div
              key={s.model}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="rounded-xl p-4 text-center space-y-2"
              style={{
                background: `${s.color}08`,
                border: `1px solid ${s.color}20`,
                boxShadow: `0 0 20px ${s.color}08`,
              }}
            >
              <span className="text-xs font-mono" style={{ color: modelColor(s.model) }}>
                {s.model}
              </span>
              <p
                className="text-xl font-bold"
                style={{
                  color: s.color,
                  textShadow: `0 0 15px ${s.color}30`,
                }}
              >
                {s.style}
              </p>
              <p className="text-[10px] text-muted-foreground/50">
                {s.backtracks} backtrack{s.backtracks !== 1 ? "s" : ""}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Overlaid phase distribution */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-xl p-5"
      >
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-4">
          Token Distribution by Phase
        </p>

        <div className="space-y-4">
          {data.allPhaseTypes.map((phaseType, pi) => {
            const color = PHASE_COLORS[phaseType];
            return (
              <div key={phaseType} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                  <span
                    className="text-xs font-medium capitalize"
                    style={{ color }}
                  >
                    {PHASE_LABELS[phaseType]}
                  </span>
                </div>
                <div className="space-y-1 pl-4">
                  {traces.map((t, ti) => {
                    const pct = (data.distributions[ti][phaseType] || 0) * 100;
                    const mColor = modelColor(t.model);
                    return (
                      <div key={t.model} className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-mono w-24 truncate"
                          style={{ color: mColor }}
                        >
                          {t.model}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-[oklch(0.12_0.01_260)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              delay: 0.6 + pi * 0.05 + ti * 0.03,
                              duration: 0.6,
                            }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${mColor}80, ${mColor})`,
                              boxShadow: `0 0 6px ${mColor}30`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/50 w-10 text-right">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Model legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[oklch(0.2_0.02_260_/_30%)]">
          {traces.map((t) => {
            const color = modelColor(t.model);
            return (
              <div key={t.model} className="flex items-center gap-1.5 text-[10px]">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
                <span className="font-mono" style={{ color }}>
                  {t.model}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Phase flow comparison — stacked timelines */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass rounded-xl p-5"
      >
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-4">
          Phase Flow Comparison
        </p>
        <div className="space-y-3">
          {traces.map((t, ti) => {
            const color = modelColor(t.model);
            return (
              <div key={t.model} className="space-y-1">
                <span
                  className="text-[10px] font-mono"
                  style={{ color }}
                >
                  {t.model}
                </span>
                <div className="flex h-6 rounded-md overflow-hidden gap-0.5">
                  {t.phases.map((phase, pi) => {
                    const width = Math.max(
                      (phase.tokenCount / t.totalTokens) * 100,
                      3
                    );
                    const phaseColor = PHASE_COLORS[phase.type];
                    return (
                      <motion.div
                        key={pi}
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${width}%`, opacity: 1 }}
                        transition={{
                          delay: 0.8 + ti * 0.15 + pi * 0.05,
                          duration: 0.4,
                        }}
                        className="relative group cursor-pointer rounded-sm"
                        style={{
                          background: `linear-gradient(180deg, ${phaseColor}40, ${phaseColor}20)`,
                          borderTop: `2px solid ${phaseColor}`,
                        }}
                      >
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                          style={{
                            background: `${phaseColor}20`,
                            border: `1px solid ${phaseColor}40`,
                            color: phaseColor,
                          }}
                        >
                          {phase.label} · {phase.tokenCount} tok
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-[oklch(0.2_0.02_260_/_30%)]">
          {data.allPhaseTypes.map((type) => (
            <span key={type} className="flex items-center gap-1 text-[10px]">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: PHASE_COLORS[type] }}
              />
              <span className="text-muted-foreground capitalize">
                {PHASE_LABELS[type]}
              </span>
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function CompareBar({
  label,
  traces,
  getValue,
  formatValue,
  max,
  delay,
  accentColor,
}: {
  label: string;
  traces: StructuredTrace[];
  getValue: (t: StructuredTrace) => number;
  formatValue: (v: number) => string;
  max: number;
  delay: number;
  accentColor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground/60">{label}</span>
      <div className="space-y-1">
        {traces.map((t) => {
          const value = getValue(t);
          const pct = max > 0 ? (value / max) * 100 : 0;
          const isMax = value === max;
          const color = accentColor ?? modelColor(t.model);

          return (
            <div key={t.model} className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono w-24 truncate"
                style={{ color: modelColor(t.model) }}
              >
                {t.model}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-[oklch(0.12_0.01_260)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: delay + 0.1, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${color}60, ${color})`,
                    boxShadow: isMax ? `0 0 8px ${color}40` : undefined,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-mono min-w-[50px] text-right"
                style={{ color: isMax ? color : "oklch(0.5 0 0)" }}
              >
                {formatValue(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
