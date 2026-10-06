"use client";

import { motion } from "framer-motion";
import { Phase, PhaseType } from "@/lib/parser/types";

const PHASE_COLORS: Record<PhaseType, string> = {
  understand: "#3b82f6",
  plan: "#8b5cf6",
  execute: "#10b981",
  evaluate: "#f59e0b",
  backtrack: "#ef4444",
  verify: "#06b6d4",
};

interface PhaseTimelineProps {
  phases: Phase[];
  totalTokens: number;
  activePhaseId?: string;
  onPhaseClick?: (phaseId: string) => void;
}

export function PhaseTimeline({
  phases,
  totalTokens,
  activePhaseId,
  onPhaseClick,
}: PhaseTimelineProps) {
  if (!phases.length) return null;

  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-[oklch(0.12_0.01_260)]">
      {phases.map((phase, i) => {
        const widthPercent = Math.max(
          (phase.tokenCount / totalTokens) * 100,
          2
        );
        const color = PHASE_COLORS[phase.type];
        const isActive = !activePhaseId || activePhaseId === phase.id;

        return (
          <motion.button
            key={phase.id}
            initial={{ width: 0 }}
            animate={{ width: `${widthPercent}%` }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="h-full rounded-sm transition-opacity"
            style={{
              background: `linear-gradient(180deg, ${color}, ${color}80)`,
              opacity: isActive ? 1 : 0.2,
              boxShadow: isActive ? `0 0 6px ${color}40` : undefined,
            }}
            onClick={() => onPhaseClick?.(phase.id)}
            title={`${phase.label}: ${phase.tokenCount} tokens`}
          />
        );
      })}
    </div>
  );
}
