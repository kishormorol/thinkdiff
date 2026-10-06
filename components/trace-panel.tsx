"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StructuredTrace, Phase, StepType, PhaseType } from "@/lib/parser/types";
import { PhaseTimeline } from "./phase-timeline";
import { TraceTree } from "./trace-tree";
import { ReasoningReplay } from "./reasoning-replay";
import { MetricsDashboard } from "./metrics-dashboard";

const STEP_COLORS: Record<StepType, { bg: string; border: string }> = {
  assertion: { bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.2)" },
  question: { bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.25)" },
  hypothesis: { bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.25)" },
  contradiction: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)" },
  conclusion: { bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.25)" },
  backtrack: { bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.3)" },
};

const STEP_ICONS: Record<StepType, { icon: string; color: string }> = {
  assertion: { icon: "→", color: "#94a3b8" },
  question: { icon: "?", color: "#60a5fa" },
  hypothesis: { icon: "~", color: "#a78bfa" },
  contradiction: { icon: "✕", color: "#f87171" },
  conclusion: { icon: "✓", color: "#34d399" },
  backtrack: { icon: "↩", color: "#fb923c" },
};

type ViewTab = "structured" | "tree" | "replay" | "raw" | "metrics";

const TABS: { id: ViewTab; label: string; icon: string }[] = [
  { id: "structured", label: "Steps", icon: "≡" },
  { id: "tree", label: "Tree", icon: "⊞" },
  { id: "replay", label: "Replay", icon: "▶" },
  { id: "raw", label: "Raw", icon: "{ }" },
  { id: "metrics", label: "Metrics", icon: "◎" },
];

interface TracePanelProps {
  trace: StructuredTrace;
  index?: number;
}

export function TracePanel({ trace, index = 0 }: TracePanelProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("structured");
  const [activePhaseId, setActivePhaseId] = useState<string | undefined>();

  const filteredPhases = activePhaseId
    ? trace.phases.filter((p) => p.id === activePhaseId)
    : trace.phases;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className="glass rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-[oklch(0.2_0.02_260_/_30%)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-sm font-mono font-semibold text-foreground/90">
              {trace.model}
            </span>
          </div>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-[oklch(0.3_0.05_260_/_40%)] text-muted-foreground"
            >
              {trace.totalTokens.toLocaleString()} tok
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-[oklch(0.3_0.05_195_/_40%)] text-[oklch(0.7_0.1_195)]"
            >
              {(trace.totalTimeMs / 1000).toFixed(1)}s
            </Badge>
          </div>
        </div>

        <PhaseTimeline
          phases={trace.phases}
          totalTokens={trace.totalTokens}
          activePhaseId={activePhaseId}
          onPhaseClick={(id) =>
            setActivePhaseId(activePhaseId === id ? undefined : id)
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[oklch(0.2_0.02_260_/_30%)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition-all relative ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              <span className="font-mono text-xs">{tab.icon}</span>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId={`tab-${trace.id}`}
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-indigo-400"
                style={{ boxShadow: "0 0 8px rgba(99,102,241,0.4)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-4">
        {activeTab === "structured" && (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-3">
              {filteredPhases.map((phase) => (
                <PhaseBlock key={phase.id} phase={phase} />
              ))}
            </div>
          </ScrollArea>
        )}

        {activeTab === "tree" && <TraceTree trace={trace} />}

        {activeTab === "replay" && <ReasoningReplay trace={trace} />}

        {activeTab === "raw" && (
          <ScrollArea className="h-[500px]">
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground/60 pr-3">
              {trace.rawTrace}
            </pre>
          </ScrollArea>
        )}

        {activeTab === "metrics" && <MetricsDashboard trace={trace} />}
      </div>

      {/* Answer */}
      {trace.answer && (
        <div className="px-5 py-3 border-t border-[oklch(0.2_0.02_260_/_30%)] bg-[oklch(0.1_0.02_155_/_20%)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-emerald-400 text-[10px] font-semibold tracking-wider uppercase">
              ✓ Answer
            </span>
          </div>
          <p className="text-sm text-foreground/70 line-clamp-3">
            {trace.answer}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function PhaseBlock({ phase }: { phase: Phase }) {
  const PHASE_ACCENT: Record<PhaseType, string> = {
    understand: "#3b82f6",
    plan: "#8b5cf6",
    execute: "#10b981",
    evaluate: "#f59e0b",
    backtrack: "#ef4444",
    verify: "#06b6d4",
  };

  const color = PHASE_ACCENT[phase.type];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold capitalize" style={{ color }}>
          {phase.label}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/50">
          {phase.tokenCount} tok
        </span>
      </div>
      <div
        className="space-y-1 pl-3"
        style={{ borderLeft: `2px solid ${color}20` }}
      >
        {phase.steps.map((step) => {
          const stepStyle = STEP_COLORS[step.type];
          const icon = STEP_ICONS[step.type];
          return (
            <div
              key={step.id}
              className="text-sm p-2.5 rounded-lg flex items-start gap-2"
              style={{
                background: stepStyle.bg,
                border: `1px solid ${stepStyle.border}`,
              }}
            >
              <span
                className="font-mono text-xs mt-0.5 shrink-0"
                style={{ color: icon.color }}
              >
                {icon.icon}
              </span>
              <span className="text-foreground/70 text-xs leading-relaxed">
                {step.content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
