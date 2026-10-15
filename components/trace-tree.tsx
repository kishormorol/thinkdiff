"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  Position,
  MarkerType,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StructuredTrace, PhaseType, StepType } from "@/lib/parser/types";

/* ═══════════════════════════════════════════════
   COLOR SYSTEM
   ═══════════════════════════════════════════════ */

const PHASE_THEME: Record<
  PhaseType,
  { bg: string; border: string; glow: string; text: string; accent: string }
> = {
  understand: {
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.4)",
    glow: "0 0 20px rgba(59,130,246,0.15), 0 0 60px rgba(59,130,246,0.05)",
    text: "#93c5fd",
    accent: "#3b82f6",
  },
  plan: {
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.4)",
    glow: "0 0 20px rgba(139,92,246,0.15), 0 0 60px rgba(139,92,246,0.05)",
    text: "#c4b5fd",
    accent: "#8b5cf6",
  },
  execute: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.4)",
    glow: "0 0 20px rgba(16,185,129,0.15), 0 0 60px rgba(16,185,129,0.05)",
    text: "#6ee7b7",
    accent: "#10b981",
  },
  evaluate: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.4)",
    glow: "0 0 20px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)",
    text: "#fcd34d",
    accent: "#f59e0b",
  },
  backtrack: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.5)",
    glow: "0 0 25px rgba(239,68,68,0.2), 0 0 80px rgba(239,68,68,0.08)",
    text: "#fca5a5",
    accent: "#ef4444",
  },
  verify: {
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.4)",
    glow: "0 0 20px rgba(6,182,212,0.15), 0 0 60px rgba(6,182,212,0.05)",
    text: "#67e8f9",
    accent: "#06b6d4",
  },
};

const STEP_ICONS: Record<StepType, { icon: string; color: string }> = {
  assertion: { icon: "→", color: "#94a3b8" },
  question: { icon: "?", color: "#60a5fa" },
  hypothesis: { icon: "~", color: "#a78bfa" },
  contradiction: { icon: "✕", color: "#f87171" },
  conclusion: { icon: "✓", color: "#34d399" },
  backtrack: { icon: "↩", color: "#fb923c" },
};

/* ═══════════════════════════════════════════════
   CUSTOM NODE COMPONENTS
   ═══════════════════════════════════════════════ */

function RootNode({ data }: { data: { label: string } }) {
  return (
    <div
      className="relative px-5 py-3 rounded-2xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))",
        border: "1px solid rgba(99,102,241,0.3)",
        boxShadow:
          "0 0 30px rgba(99,102,241,0.12), 0 0 80px rgba(99,102,241,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2 !h-2 !border-0" />
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs font-mono font-semibold text-indigo-200 tracking-wide uppercase">
          {data.label}
        </span>
      </div>
    </div>
  );
}

function PhaseNode({
  data,
}: {
  data: {
    label: string;
    type: PhaseType;
    tokenCount: number;
    stepCount: number;
    isBacktrack: boolean;
    index: number;
  };
}) {
  const theme = PHASE_THEME[data.type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: data.index * 0.1, type: "spring", stiffness: 200 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-3 !h-3 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !w-3 !h-3 !border-0" />
      <Handle type="source" position={Position.Right} id="steps" className="!bg-transparent !w-2 !h-2 !border-0" />

      <div
        className="px-5 py-3.5 rounded-xl min-w-[200px]"
        style={{
          background: theme.bg,
          border: `1px ${data.isBacktrack ? "dashed" : "solid"} ${theme.border}`,
          boxShadow: theme.glow,
        }}
      >
        {/* Phase label */}
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: theme.accent }}
          />
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: theme.text }}
          >
            {data.label}
          </span>
        </div>

        {/* Metrics bar */}
        <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: `${theme.text}80` }}>
          <span>{data.tokenCount} tok</span>
          <span className="opacity-30">|</span>
          <span>{data.stepCount} steps</span>
          {data.isBacktrack && (
            <>
              <span className="opacity-30">|</span>
              <span className="text-red-400">↩ backtrack</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StepNode({
  data,
}: {
  data: {
    content: string;
    stepType: StepType;
    phaseType: PhaseType;
    index: number;
    globalIndex: number;
  };
}) {
  const step = STEP_ICONS[data.stepType];
  const phase = PHASE_THEME[data.phaseType];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: data.globalIndex * 0.05 + 0.3 }}
    >
      <Handle type="target" position={Position.Left} className="!bg-transparent !w-2 !h-2 !border-0" />

      <div
        className="px-3 py-2 rounded-lg max-w-[280px]"
        style={{
          background: "rgba(15,15,30,0.6)",
          border: `1px solid ${phase.border}30`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-start gap-2">
          <span
            className="font-mono text-sm mt-0.5 shrink-0"
            style={{ color: step.color }}
          >
            {step.icon}
          </span>
          <span className="text-[11px] leading-relaxed text-gray-300 line-clamp-3">
            {data.content}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function AnswerNode({ data }: { data: { answer: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: "spring" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-2 !h-2 !border-0" />

      <div
        className="px-5 py-3 rounded-xl max-w-[250px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))",
          border: "1px solid rgba(16,185,129,0.35)",
          boxShadow:
            "0 0 30px rgba(16,185,129,0.12), 0 0 80px rgba(16,185,129,0.05)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-emerald-400 text-xs font-semibold tracking-wide">
            ✓ ANSWER
          </span>
        </div>
        <p className="text-xs text-emerald-100/70 line-clamp-3 leading-relaxed">
          {data.answer}
        </p>
      </div>
    </motion.div>
  );
}

const nodeTypes: NodeTypes = {
  root: RootNode,
  phase: PhaseNode,
  step: StepNode,
  answer: AnswerNode,
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

interface TraceTreeProps {
  trace: StructuredTrace;
}

export function TraceTree({ trace }: TraceTreeProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let globalStepIdx = 0;

    // Root
    nodes.push({
      id: "root",
      type: "root",
      position: { x: 300, y: 0 },
      data: { label: trace.model },
    });

    let yOffset = 90;

    trace.phases.forEach((phase, pi) => {
      const phaseId = `phase-${pi}`;
      const isBacktrack = phase.type === "backtrack";
      const theme = PHASE_THEME[phase.type];

      // Phase node
      nodes.push({
        id: phaseId,
        type: "phase",
        position: { x: 300, y: yOffset },
        data: {
          label: phase.label,
          type: phase.type,
          tokenCount: phase.tokenCount,
          stepCount: phase.steps.length,
          isBacktrack,
          index: pi,
        },
      });

      // Edge from prev
      const sourceId = pi === 0 ? "root" : `phase-${pi - 1}`;
      edges.push({
        id: `e-${sourceId}-${phaseId}`,
        source: sourceId,
        target: phaseId,
        type: "smoothstep",
        animated: isBacktrack,
        style: {
          stroke: isBacktrack ? "#ef4444" : `${theme.accent}60`,
          strokeWidth: isBacktrack ? 2.5 : 1.5,
          strokeDasharray: isBacktrack ? "8,4" : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isBacktrack ? "#ef4444" : `${theme.accent}80`,
          width: 12,
          height: 12,
        },
      });

      // Step nodes
      phase.steps.forEach((step, si) => {
        const stepId = `step-${pi}-${si}`;

        nodes.push({
          id: stepId,
          type: "step",
          position: { x: 580, y: yOffset + si * 55 - 10 },
          data: {
            content: step.content,
            stepType: step.type,
            phaseType: phase.type,
            index: si,
            globalIndex: globalStepIdx++,
          },
        });

        edges.push({
          id: `e-${phaseId}-${stepId}`,
          source: phaseId,
          sourceHandle: "steps",
          target: stepId,
          type: "smoothstep",
          style: {
            stroke: `${theme.accent}25`,
            strokeWidth: 1,
          },
        });
      });

      yOffset += Math.max(phase.steps.length * 55, 90) + 40;
    });

    // Answer
    nodes.push({
      id: "answer",
      type: "answer",
      position: { x: 300, y: yOffset },
      data: { answer: trace.answer },
    });

    if (trace.phases.length > 0) {
      edges.push({
        id: "e-last-answer",
        source: `phase-${trace.phases.length - 1}`,
        target: "answer",
        type: "smoothstep",
        style: { stroke: "rgba(16,185,129,0.5)", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#10b981",
          width: 14,
          height: 14,
        },
      });
    }

    return { nodes, edges };
  }, [trace]);

  return (
    <div className="w-full h-[650px] rounded-xl overflow-hidden border border-[oklch(0.2_0.02_260_/_40%)] bg-[oklch(0.06_0.01_260)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={30} size={1} color="rgba(99,102,241,0.04)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
