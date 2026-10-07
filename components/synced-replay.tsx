"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StructuredTrace, PhaseType, StepType } from "@/lib/parser/types";

const PHASE_COLORS: Record<PhaseType, string> = {
  understand: "#3b82f6",
  plan: "#8b5cf6",
  execute: "#10b981",
  evaluate: "#f59e0b",
  backtrack: "#ef4444",
  verify: "#06b6d4",
};

const STEP_ICONS: Record<StepType, string> = {
  assertion: "→",
  question: "?",
  hypothesis: "~",
  contradiction: "✕",
  conclusion: "✓",
  backtrack: "↩",
};

const MODEL_COLORS: Record<string, string> = {
  "claude-sonnet": "#818cf8",
  "deepseek-r1": "#34d399",
  "o3-mini": "#f59e0b",
};

interface FlatStep {
  content: string;
  type: StepType;
  phaseType: PhaseType;
  phaseLabel: string;
  isFirstInPhase: boolean;
  normalizedPosition: number; // 0–1 position within total steps
}

interface SyncedReplayProps {
  traces: StructuredTrace[];
}

export function SyncedReplay({ traces }: SyncedReplayProps) {
  // Flatten each trace's steps and compute normalized positions
  const flatTraces = useMemo(() => {
    return traces.map((trace) => {
      const steps: FlatStep[] = [];
      trace.phases.forEach((phase) => {
        phase.steps.forEach((step, si) => {
          steps.push({
            content: step.content,
            type: step.type,
            phaseType: phase.type,
            phaseLabel: phase.label,
            isFirstInPhase: si === 0,
            normalizedPosition: 0, // set below
          });
        });
      });
      // Normalize positions
      steps.forEach((s, i) => {
        s.normalizedPosition = steps.length > 1 ? i / (steps.length - 1) : 0;
      });
      return { model: trace.model, steps, totalSteps: steps.length };
    });
  }, [traces]);

  // Global timeline: use the longest trace's step count
  const maxSteps = Math.max(...flatTraces.map((t) => t.totalSteps));

  const [globalStep, setGlobalStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    if (globalStep >= maxSteps - 1) {
      setIsPlaying(false);
      return;
    }
    const delay = Math.max(300, 1200 / speed);
    const timer = setTimeout(() => setGlobalStep((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [isPlaying, globalStep, speed, maxSteps]);

  // Scroll to bottom
  useEffect(() => {
    scrollRefs.current.forEach((ref) => {
      if (ref) ref.scrollTop = ref.scrollHeight;
    });
  }, [globalStep]);

  // For each trace, calculate how many steps should be visible at the current global step
  const visibleCounts = useMemo(() => {
    if (globalStep < 0) return flatTraces.map(() => 0);
    const normalizedPos = maxSteps > 1 ? globalStep / (maxSteps - 1) : 1;
    return flatTraces.map((t) => {
      // Show steps up to the normalized position
      let count = 0;
      for (const step of t.steps) {
        if (step.normalizedPosition <= normalizedPos + 0.001) count++;
        else break;
      }
      return count;
    });
  }, [globalStep, flatTraces, maxSteps]);

  const progress = maxSteps > 0 ? ((globalStep + 1) / maxSteps) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Shared controls */}
      <div className="flex items-center gap-3 glass rounded-xl p-3">
        <button
          onClick={() => {
            if (globalStep >= maxSteps - 1) setGlobalStep(-1);
            setIsPlaying(!isPlaying);
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all"
          style={{
            background: isPlaying
              ? "rgba(239,68,68,0.15)"
              : "rgba(99,102,241,0.15)",
            border: `1px solid ${isPlaying ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`,
            color: isPlaying ? "#fca5a5" : "#818cf8",
          }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          onClick={() => {
            setGlobalStep(-1);
            setIsPlaying(false);
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm glass border-[oklch(0.25_0.02_260_/_40%)] text-muted-foreground hover:text-foreground transition-all"
        >
          ⏮
        </button>

        {/* Unified progress bar with all models */}
        <div className="flex-1 relative">
          <div className="h-3 rounded-full bg-[oklch(0.12_0.01_260)] overflow-hidden relative">
            {/* Model progress indicators */}
            {flatTraces.map((t, ti) => {
              const modelProgress =
                t.totalSteps > 0
                  ? (visibleCounts[ti] / t.totalSteps) * 100
                  : 0;
              const color = MODEL_COLORS[t.model] ?? "#818cf8";
              return (
                <motion.div
                  key={t.model}
                  className="absolute h-full rounded-full"
                  style={{
                    background: color,
                    opacity: 0.4 + ti * 0.15,
                    top: 0,
                    zIndex: flatTraces.length - ti,
                  }}
                  animate={{ width: `${modelProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              );
            })}
          </div>

          {/* Scrubber */}
          <input
            type="range"
            min={-1}
            max={maxSteps - 1}
            value={globalStep}
            onChange={(e) => {
              setGlobalStep(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1">
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                speed === s
                  ? "bg-[oklch(0.3_0.08_260)] text-indigo-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-muted-foreground min-w-[60px] text-right">
          {globalStep + 1}/{maxSteps}
        </span>
      </div>

      {/* Model legend */}
      <div className="flex items-center justify-center gap-6">
        {flatTraces.map((t, ti) => {
          const color = MODEL_COLORS[t.model] ?? "#818cf8";
          return (
            <div key={t.model} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}40` }}
              />
              <span className="font-mono font-semibold" style={{ color }}>
                {t.model}
              </span>
              <span className="text-muted-foreground/40 font-mono">
                {visibleCounts[ti]}/{t.totalSteps}
              </span>
            </div>
          );
        })}
      </div>

      {/* Side-by-side replay columns */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${traces.length}, 1fr)`,
        }}
      >
        {flatTraces.map((t, ti) => {
          const color = MODEL_COLORS[t.model] ?? "#818cf8";
          const visible = t.steps.slice(0, visibleCounts[ti]);
          const currentIdx = visibleCounts[ti] - 1;

          return (
            <div key={t.model} className="flex flex-col">
              {/* Model header */}
              <div
                className="px-4 py-2.5 rounded-t-xl flex items-center justify-between"
                style={{
                  background: `${color}08`,
                  borderBottom: `2px solid ${color}30`,
                }}
              >
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color }}
                >
                  {t.model}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/40">
                  {visibleCounts[ti]} steps
                </span>
              </div>

              {/* Replay area */}
              <div
                ref={(el) => { scrollRefs.current[ti] = el; }}
                className="h-[500px] overflow-y-auto rounded-b-xl border border-[oklch(0.2_0.02_260_/_40%)] border-t-0 bg-[oklch(0.06_0.01_260)] p-3 space-y-1 scroll-smooth"
              >
                <AnimatePresence>
                  {visible.map((step, i) => {
                    const phaseColor = PHASE_COLORS[step.phaseType];
                    const icon = STEP_ICONS[step.type];
                    const isCurrent = i === currentIdx;

                    return (
                      <div key={i}>
                        {step.isFirstInPhase && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 mt-3 mb-1.5 first:mt-0"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: phaseColor }}
                            />
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider"
                              style={{ color: phaseColor }}
                            >
                              {step.phaseLabel}
                            </span>
                            <div
                              className="flex-1 h-px"
                              style={{ background: `${phaseColor}25` }}
                            />
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{
                            opacity: isCurrent ? 1 : 0.5,
                            y: 0,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          }}
                          className="flex items-start gap-1.5 pl-3 py-1 rounded-md transition-all"
                          style={{
                            background: isCurrent
                              ? `${phaseColor}10`
                              : "transparent",
                            borderLeft: isCurrent
                              ? `2px solid ${phaseColor}`
                              : "2px solid transparent",
                          }}
                        >
                          <span
                            className="font-mono text-xs mt-0.5 shrink-0"
                            style={{ color: `${phaseColor}90` }}
                          >
                            {icon}
                          </span>
                          <span
                            className="text-[11px] leading-relaxed"
                            style={{
                              color: isCurrent
                                ? "rgba(230,230,250,0.85)"
                                : "rgba(160,160,180,0.45)",
                            }}
                          >
                            {step.content}
                          </span>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>

                {isPlaying && visibleCounts[ti] < t.totalSteps && (
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="flex items-center gap-2 pl-3 pt-2"
                  >
                    <span
                      className="w-1.5 h-3 rounded-sm"
                      style={{ background: color }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
