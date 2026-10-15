"use client";

import { useState, useEffect, useRef } from "react";
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

interface ReasoningReplayProps {
  trace: StructuredTrace;
}

export function ReasoningReplay({ trace }: ReasoningReplayProps) {
  // Flatten all steps with phase context
  const allSteps = trace.phases.flatMap((phase, pi) =>
    phase.steps.map((step, si) => ({
      ...step,
      phaseType: phase.type,
      phaseLabel: phase.label,
      phaseIndex: pi,
      stepIndex: si,
      isFirstInPhase: si === 0,
    }))
  );

  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const atEnd = currentStep >= allSteps.length - 1;
    const delay = atEnd ? 0 : Math.max(300, 1200 / speed);
    const timer = setTimeout(
      () => (atEnd ? setIsPlaying(false) : setCurrentStep((s) => s + 1)),
      delay
    );
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, speed, allSteps.length]);

  // Scroll to bottom as new steps appear
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentStep]);

  const visibleSteps = allSteps.slice(0, currentStep + 1);
  const progress =
    allSteps.length > 0 ? ((currentStep + 1) / allSteps.length) * 100 : 0;

  // Current phase for the background glow
  const currentPhase =
    currentStep >= 0 ? allSteps[currentStep]?.phaseType : null;
  const currentColor = currentPhase
    ? PHASE_COLORS[currentPhase]
    : "transparent";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 glass rounded-xl p-3">
        <button
          onClick={() => {
            if (currentStep >= allSteps.length - 1) setCurrentStep(-1);
            setIsPlaying(!isPlaying);
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all"
          style={{
            background: isPlaying
              ? `${currentColor}20`
              : "rgba(99,102,241,0.15)",
            border: `1px solid ${isPlaying ? `${currentColor}40` : "rgba(99,102,241,0.3)"}`,
            color: isPlaying ? currentColor : "#818cf8",
          }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          onClick={() => {
            setCurrentStep(-1);
            setIsPlaying(false);
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm glass border-[oklch(0.25_0.02_260_/_40%)] text-muted-foreground hover:text-foreground transition-all"
        >
          ⏮
        </button>

        {/* Progress bar */}
        <div className="flex-1 relative h-2 rounded-full bg-[oklch(0.15_0.02_260)] overflow-hidden">
          {/* Phase segments */}
          {trace.phases.map((phase, pi) => {
            const phaseStepStart = allSteps.findIndex(
              (s) => s.phaseIndex === pi
            );
            const left = (phaseStepStart / allSteps.length) * 100;
            const width = (phase.steps.length / allSteps.length) * 100;
            return (
              <div
                key={pi}
                className="absolute top-0 h-full opacity-20"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: PHASE_COLORS[phase.type],
                }}
              />
            );
          })}

          {/* Progress fill */}
          <motion.div
            className="absolute top-0 h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, #6366f1, ${currentColor || "#6366f1"})`,
              boxShadow: `0 0 10px ${currentColor || "#6366f1"}40`,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />

          {/* Clickable overlay */}
          <input
            type="range"
            min={-1}
            max={allSteps.length - 1}
            value={currentStep}
            onChange={(e) => {
              setCurrentStep(parseInt(e.target.value));
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
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                speed === s
                  ? "bg-[oklch(0.3_0.08_260)] text-indigo-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Counter */}
        <span className="text-xs font-mono text-muted-foreground min-w-[60px] text-right">
          {currentStep + 1}/{allSteps.length}
        </span>
      </div>

      {/* Replay area */}
      <div
        ref={containerRef}
        className="h-[500px] overflow-y-auto rounded-xl border border-[oklch(0.2_0.02_260_/_40%)] bg-[oklch(0.06_0.01_260)] p-4 space-y-1 scroll-smooth"
        style={{
          boxShadow: currentPhase
            ? `inset 0 0 80px ${currentColor}05`
            : undefined,
        }}
      >
        <AnimatePresence>
          {visibleSteps.map((step, i) => {
            const color = PHASE_COLORS[step.phaseType];
            const icon = STEP_ICONS[step.type];
            const isCurrent = i === currentStep;

            return (
              <div key={`${step.phaseIndex}-${step.stepIndex}`}>
                {/* Phase header */}
                {step.isFirstInPhase && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mt-4 mb-2 first:mt-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: color }}
                    />
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color }}
                    >
                      {step.phaseLabel}
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: `${color}30` }}
                    />
                  </motion.div>
                )}

                {/* Step */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{
                    opacity: isCurrent ? 1 : 0.6,
                    y: 0,
                    scale: 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-start gap-2 pl-4 py-1.5 rounded-lg transition-all"
                  style={{
                    background: isCurrent ? `${color}10` : "transparent",
                    borderLeft: isCurrent
                      ? `2px solid ${color}`
                      : "2px solid transparent",
                  }}
                >
                  <span
                    className="font-mono text-sm mt-0.5 shrink-0"
                    style={{ color: `${color}90` }}
                  >
                    {icon}
                  </span>
                  <span
                    className="text-sm leading-relaxed"
                    style={{
                      color: isCurrent
                        ? "rgba(230,230,250,0.9)"
                        : "rgba(180,180,200,0.5)",
                    }}
                  >
                    {step.content}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* Cursor */}
        {isPlaying && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="flex items-center gap-2 pl-4 pt-2"
          >
            <span className="w-2 h-4 rounded-sm" style={{ background: currentColor }} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
