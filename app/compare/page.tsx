"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ComparisonView } from "@/components/comparison-view";
import { useStore } from "@/lib/store";

export default function ComparePage() {
  const { rawResults, structuredTraces, isExecuting, prompt } = useStore();
  const hasParsed = structuredTraces.length > 0;

  const handleParse = async () => {
    if (rawResults.length === 0) return;
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          results: rawResults.filter((r) => !r.error && r.rawTrace),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        useStore.getState().setStructuredTraces(data.traces);
      }
    } catch {
      // Fall back to raw view
    }
  };

  return (
    <main className="flex-1 flex flex-col px-4 py-6">
      {/* Nav bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 max-w-[1400px] mx-auto w-full"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground glass border-[oklch(0.2_0.02_260_/_30%)] hover:border-[oklch(0.3_0.05_260_/_40%)] transition-all"
          >
            ← New Prompt
          </Link>
          <h1 className="text-lg font-bold tracking-tighter">
            <span className="bg-gradient-to-r from-[oklch(0.75_0.18_260)] to-[oklch(0.8_0.15_195)] bg-clip-text text-transparent">
              Think
            </span>
            <span className="text-foreground/30">Diff</span>
          </h1>
        </div>

        {!hasParsed && rawResults.length > 0 && (
          <button
            onClick={handleParse}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all group relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            <span className="relative z-10 flex items-center gap-2 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Parse & Structure Traces
            </span>
          </button>
        )}
      </motion.div>

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto w-full flex-1">
        {isExecuting ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500/30 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-4 rounded-full border-2 border-indigo-400/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground/60">
                Models are reasoning...
              </p>
            </motion.div>
          </div>
        ) : (
          <ComparisonView />
        )}
      </div>
    </main>
  );
}
