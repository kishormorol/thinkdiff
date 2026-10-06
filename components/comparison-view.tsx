"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { TracePanel } from "./trace-panel";
import { AlignedComparison } from "./aligned-comparison";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type ViewMode = "panels" | "aligned";

export function ComparisonView() {
  const { structuredTraces, rawResults, prompt } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>("panels");

  const hasStructured = structuredTraces.length > 0;
  const traces = hasStructured ? structuredTraces : [];

  if (!hasStructured && rawResults.length > 0) {
    return <RawComparisonView />;
  }

  if (traces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-2xl text-muted-foreground/30">
          ⊘
        </div>
        <p className="text-muted-foreground text-sm">
          No traces to compare. Go back and run a prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prompt display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">
          Prompt
        </p>
        <p className="text-sm text-foreground/70 max-w-2xl mx-auto font-mono glass rounded-xl px-5 py-3 inline-block">
          {prompt}
        </p>
      </motion.div>

      {/* View toggle */}
      {traces.length >= 2 && (
        <div className="flex justify-center">
          <div className="glass rounded-xl p-1 flex gap-1">
            {(["panels", "aligned"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === mode
                    ? "bg-[oklch(0.25_0.08_260_/_60%)] text-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "panels" ? "⊞ Side by Side" : "≡ Aligned"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      {viewMode === "aligned" && traces.length >= 2 ? (
        <AlignedComparison traces={traces} />
      ) : (
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: `repeat(${Math.min(traces.length, 3)}, 1fr)`,
          }}
        >
          {traces.map((trace, i) => (
            <TracePanel key={trace.id} trace={trace} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function RawComparisonView() {
  const { rawResults, prompt } = useStore();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">
          Prompt
        </p>
        <p className="text-sm text-foreground/70 max-w-2xl mx-auto font-mono glass rounded-xl px-5 py-3 inline-block">
          {prompt}
        </p>
      </motion.div>

      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: `repeat(${Math.min(rawResults.length, 3)}, 1fr)`,
        }}
      >
        {rawResults.map((result, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="glass rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[oklch(0.2_0.02_260_/_30%)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${result.error ? "bg-red-400" : "bg-emerald-400"} animate-pulse`}
                />
                <span className="font-mono font-semibold text-sm">
                  {result.model}
                </span>
              </div>
              {!result.error && (
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-[oklch(0.3_0.05_260_/_40%)] text-muted-foreground"
                  >
                    {result.totalTokens.toLocaleString()} tok
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-[oklch(0.3_0.05_195_/_40%)] text-[oklch(0.7_0.1_195)]"
                  >
                    {(result.totalTimeMs / 1000).toFixed(1)}s
                  </Badge>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-5 flex-1">
              {result.error ? (
                <p className="text-sm text-red-400">{result.error}</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">
                      Reasoning Trace
                    </p>
                    <ScrollArea className="h-[400px]">
                      <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground/60">
                        {result.rawTrace || "(no reasoning trace exposed)"}
                      </pre>
                    </ScrollArea>
                  </div>
                  {result.answer && (
                    <div className="border-t border-[oklch(0.2_0.02_260_/_30%)] pt-3">
                      <p className="text-[10px] uppercase tracking-widest text-emerald-400/60 mb-1">
                        Answer
                      </p>
                      <p className="text-sm text-foreground/70">
                        {result.answer}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
