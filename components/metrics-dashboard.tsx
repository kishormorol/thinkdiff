"use client";

import { useEffect, useState } from "react";
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

interface MetricsDashboardProps {
  trace: StructuredTrace;
}

export function MetricsDashboard({ trace }: MetricsDashboardProps) {
  const backtrackCount = trace.phases.filter(
    (p) => p.type === "backtrack"
  ).length;
  const totalSteps = trace.phases.reduce((n, p) => n + p.steps.length, 0);

  // Phase distribution
  const phaseDistribution = trace.phases.reduce(
    (acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.tokenCount;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalPhaseTokens = Object.values(phaseDistribution).reduce(
    (a, b) => a + b,
    0
  );

  // Dominant phase
  const dominantPhase = Object.entries(phaseDistribution).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // Reasoning style
  const style =
    backtrackCount === 0
      ? "Linear"
      : backtrackCount <= 2
        ? "Exploratory"
        : "Iterative";

  const styleColor =
    backtrackCount === 0
      ? "#10b981"
      : backtrackCount <= 2
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="space-y-6">
      {/* Top metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Tokens"
          value={trace.totalTokens}
          format="number"
          color="#6366f1"
          delay={0}
        />
        <MetricCard
          label="Time"
          value={trace.totalTimeMs / 1000}
          format="time"
          color="#06b6d4"
          delay={0.1}
        />
        <MetricCard
          label="Phases"
          value={trace.phases.length}
          format="number"
          color="#8b5cf6"
          delay={0.2}
        />
        <MetricCard
          label="Backtracks"
          value={backtrackCount}
          format="number"
          color="#ef4444"
          delay={0.3}
        />
      </div>

      {/* Middle row: radial chart + style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Radial chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-5"
        >
          <p className="text-xs text-muted-foreground mb-4 font-medium tracking-wide uppercase">
            Token Distribution
          </p>
          <div className="flex items-center justify-center">
            <RadialChart
              data={Object.entries(phaseDistribution).map(([type, tokens]) => ({
                type: type as PhaseType,
                value: tokens / totalPhaseTokens,
                tokens,
              }))}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
            {Object.entries(phaseDistribution).map(([type, tokens]) => (
              <span key={type} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ background: PHASE_COLORS[type as PhaseType] }}
                />
                <span className="text-muted-foreground">
                  {PHASE_LABELS[type as PhaseType]}
                </span>
                <span className="font-mono text-foreground/60">
                  {Math.round((tokens / totalPhaseTokens) * 100)}%
                </span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Reasoning style + stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-5 space-y-5"
        >
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium tracking-wide uppercase">
              Reasoning Style
            </p>
            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-bold"
                style={{
                  color: styleColor,
                  textShadow: `0 0 20px ${styleColor}40`,
                }}
              >
                {style}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {backtrackCount === 0
                ? "Went straight to the answer without course correction"
                : backtrackCount <= 2
                  ? "Explored alternatives before converging"
                  : "Repeatedly revised approach — high iteration"}
            </p>
          </div>

          <div className="space-y-3">
            <StatRow label="Total steps" value={totalSteps} max={50} color="#6366f1" />
            <StatRow label="Backtracks" value={backtrackCount} max={10} color="#ef4444" />
            <StatRow
              label="Tokens/step"
              value={totalSteps > 0 ? Math.round(trace.totalTokens / totalSteps) : 0}
              max={200}
              color="#06b6d4"
            />
            {dominantPhase && (
              <StatRow
                label={`${PHASE_LABELS[dominantPhase[0] as PhaseType]} %`}
                value={Math.round(
                  (dominantPhase[1] / totalPhaseTokens) * 100
                )}
                max={100}
                color={PHASE_COLORS[dominantPhase[0] as PhaseType]}
                suffix="%"
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Phase flow timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-xl p-5"
      >
        <p className="text-xs text-muted-foreground mb-3 font-medium tracking-wide uppercase">
          Phase Flow
        </p>
        <div className="flex h-10 rounded-lg overflow-hidden gap-0.5">
          {trace.phases.map((phase, i) => {
            const width = Math.max(
              (phase.tokenCount / trace.totalTokens) * 100,
              3
            );
            const color = PHASE_COLORS[phase.type];
            return (
              <motion.div
                key={i}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: `${width}%`, opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
                className="relative group cursor-pointer rounded-sm"
                style={{
                  background: `linear-gradient(180deg, ${color}30, ${color}15)`,
                  borderTop: `2px solid ${color}`,
                }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
                >
                  {phase.label} · {phase.tokenCount} tok
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function MetricCard({
  label,
  value,
  format,
  color,
  delay,
}: {
  label: string;
  value: number;
  format: "number" | "time";
  color: string;
  delay: number;
}) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(value * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-xl p-4"
      style={{
        boxShadow: `0 0 20px ${color}08, inset 0 0 20px ${color}03`,
      }}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>
        {format === "time"
          ? `${displayed.toFixed(1)}s`
          : Math.round(displayed).toLocaleString()}
      </p>
    </motion.div>
  );
}

function StatRow({
  label,
  value,
  max,
  color,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono" style={{ color }}>
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[oklch(0.15_0.01_260)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

function RadialChart({
  data,
}: {
  data: { type: PhaseType; value: number; tokens: number }[];
}) {
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Cumulative start position of each segment along the circle
  const offsets = data.map((_, i) =>
    data.slice(0, i).reduce((sum, d) => sum + circumference * d.value, 0)
  );

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(99,102,241,0.06)"
        strokeWidth={strokeWidth}
      />

      {data.map((segment, i) => {
        const segmentLength = circumference * segment.value;
        const dashOffset = circumference - offsets[i];
        const color = PHASE_COLORS[segment.type];

        return (
          <motion.circle
            key={segment.type}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            style={{
              filter: `drop-shadow(0 0 4px ${color}40)`,
            }}
          />
        );
      })}

      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2 - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground text-2xl font-bold font-mono"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {data.length}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground text-xs uppercase tracking-wider"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        phases
      </text>
    </svg>
  );
}
