"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MODEL_OPTIONS } from "@/lib/providers/types";
import { useStore } from "@/lib/store";
import { buildStructuredTrace, RawPhase } from "@/lib/parser/structure";
import { TraceResult } from "@/lib/parser/types";

const EXAMPLE_PROMPTS = [
  {
    label: "Math",
    prompt:
      "What is the sum of all prime numbers between 1 and 50? Show your reasoning step by step.",
    icon: "∑",
  },
  {
    label: "Logic",
    prompt:
      "Three friends — Alice, Bob, and Carol — each have a different pet (cat, dog, fish). Alice doesn't have a dog. Bob doesn't have a cat. Carol has a fish. Who has which pet?",
    icon: "⊢",
  },
  {
    label: "Code",
    prompt:
      'Find the bug in this Python code and explain your reasoning:\n\ndef binary_search(arr, target):\n    left, right = 0, len(arr)\n    while left < right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid\n        else:\n            right = mid\n    return -1',
    icon: "</>",
  },
];

const MODEL_ICONS: Record<string, string> = {
  "claude-sonnet": "◈",
  "deepseek-r1": "◇",
  "o3-mini": "○",
};

export function PromptInput() {
  const router = useRouter();
  const {
    prompt,
    setPrompt,
    selectedModels,
    toggleModel,
    isExecuting,
    setExecuting,
    setRawResults,
    setError,
    reset,
    rawResults,
  } = useStore();
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteModel, setPasteModel] = useState("");
  const [pasteTrace, setPasteTrace] = useState("");
  const [pasteAnswer, setPasteAnswer] = useState("");

  const handleExecute = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;
    reset();
    setExecuting(true);
    setError(null);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, models: selectedModels }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setRawResults(data.results);
      router.push("/compare");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute");
    } finally {
      setExecuting(false);
    }
  };

  const handlePaste = () => {
    if (!pasteModel || !pasteTrace.trim()) return;
    useStore.getState().addPastedTrace({
      model: pasteModel,
      rawTrace: pasteTrace.trim(),
      answer: pasteAnswer.trim(),
      totalTokens: 0,
      totalTimeMs: 0,
    });
    setPasteModel("");
    setPasteTrace("");
    setPasteAnswer("");
    setPasteMode(false);
  };

  const hasPastedTraces = rawResults.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Prompt Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-6 space-y-4"
      >
        <Textarea
          placeholder="Enter a prompt that requires reasoning..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="font-mono text-sm bg-transparent border-[oklch(0.25_0.03_260_/_50%)] focus:border-[oklch(0.5_0.15_260)] focus:ring-1 focus:ring-[oklch(0.5_0.15_260_/_30%)] transition-all resize-none placeholder:text-muted-foreground/40"
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex.label}
              onClick={() => setPrompt(ex.prompt)}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-[oklch(0.15_0.02_260_/_60%)] border border-[oklch(0.25_0.02_260_/_40%)] hover:border-[oklch(0.5_0.12_260_/_50%)] hover:text-foreground/80 hover:glow-primary transition-all duration-300"
            >
              <span className="font-mono text-[oklch(0.7_0.15_260)] group-hover:text-[oklch(0.8_0.18_260)]">
                {ex.icon}
              </span>
              {ex.label}
            </button>
          ))}
          <button
            onClick={async () => {
              const res = await fetch("/examples/math-reasoning.json");
              const data = await res.json();
              const results: (TraceResult & { phases: RawPhase[] })[] = data.results;
              setPrompt(data.prompt);
              setRawResults(results);
              // Demo traces ship pre-parsed, so every view works without API keys
              useStore.getState().setStructuredTraces(
                results.map((r) => buildStructuredTrace(r, data.prompt, r.phases))
              );
              router.push("/compare");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[oklch(0.25_0.08_260_/_60%)] to-[oklch(0.25_0.06_195_/_60%)] border border-[oklch(0.4_0.1_260_/_30%)] text-[oklch(0.8_0.12_195)] hover:glow-cyan transition-all duration-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.15_195)] animate-pulse" />
            Demo — no keys
          </button>
        </div>
      </motion.div>

      {/* Models Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODEL_OPTIONS.map((model) => {
            const isSelected = selectedModels.includes(model.id);
            return (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id)}
                className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 text-left ${
                  isSelected
                    ? "border-[oklch(0.5_0.15_260_/_60%)] bg-[oklch(0.18_0.04_260_/_60%)] glow-primary"
                    : "border-[oklch(0.2_0.02_260_/_40%)] bg-[oklch(0.12_0.01_260_/_40%)] hover:border-[oklch(0.3_0.04_260_/_50%)]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-mono transition-all ${
                    isSelected
                      ? "bg-[oklch(0.3_0.1_260_/_60%)] text-[oklch(0.8_0.18_260)]"
                      : "bg-[oklch(0.18_0.02_260_/_60%)] text-muted-foreground"
                  }`}
                >
                  {MODEL_ICONS[model.id] || "◎"}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {model.name}
                  </p>
                  <p className="text-xs text-muted-foreground/60 truncate">
                    {model.description}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[oklch(0.75_0.15_195)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex gap-3"
      >
        <button
          onClick={handleExecute}
          disabled={
            isExecuting || !prompt.trim() || selectedModels.length === 0
          }
          className="flex-1 relative h-12 rounded-xl font-medium text-sm overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.55_0.2_260)] via-[oklch(0.6_0.18_230)] to-[oklch(0.55_0.15_195)] group-hover:opacity-90 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.65_0.22_260)] via-[oklch(0.7_0.2_230)] to-[oklch(0.65_0.18_195)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10 flex items-center justify-center gap-2 text-white">
            {isExecuting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Models are thinking...
              </>
            ) : (
              <>
                <span className="text-lg">⟐</span>
                Compare Reasoning
              </>
            )}
          </span>
        </button>

        <button
          onClick={() => setPasteMode(!pasteMode)}
          className="h-12 px-5 rounded-xl text-sm font-medium glass border-[oklch(0.25_0.03_260_/_50%)] hover:border-[oklch(0.4_0.08_260_/_50%)] text-muted-foreground hover:text-foreground transition-all"
        >
          Paste
        </button>

        {hasPastedTraces && (
          <button
            onClick={() => router.push("/compare")}
            className="h-12 px-5 rounded-xl text-sm font-medium bg-[oklch(0.2_0.05_195_/_50%)] border border-[oklch(0.4_0.1_195_/_40%)] text-[oklch(0.8_0.12_195)] hover:glow-cyan transition-all"
          >
            View ({rawResults.length})
          </button>
        )}
      </motion.div>

      {/* Paste Modal */}
      <AnimatePresence>
        {pasteMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-6 space-y-4 overflow-hidden"
          >
            <h3 className="text-sm font-medium text-foreground/80">
              Paste a Reasoning Trace
            </h3>
            <input
              type="text"
              placeholder="Model name (e.g. deepseek-r1)"
              value={pasteModel}
              onChange={(e) => setPasteModel(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm bg-[oklch(0.1_0.01_260_/_60%)] border border-[oklch(0.25_0.02_260_/_50%)] text-foreground placeholder:text-muted-foreground/40 focus:border-[oklch(0.5_0.12_260)] focus:outline-none"
            />
            <Textarea
              placeholder="Paste reasoning trace..."
              value={pasteTrace}
              onChange={(e) => setPasteTrace(e.target.value)}
              rows={6}
              className="font-mono text-xs bg-transparent border-[oklch(0.25_0.03_260_/_50%)]"
            />
            <Textarea
              placeholder="Final answer (optional)..."
              value={pasteAnswer}
              onChange={(e) => setPasteAnswer(e.target.value)}
              rows={2}
              className="font-mono text-xs bg-transparent border-[oklch(0.25_0.03_260_/_50%)]"
            />
            <Button
              onClick={handlePaste}
              disabled={!pasteModel || !pasteTrace}
              size="sm"
              className="bg-[oklch(0.5_0.15_260)] hover:bg-[oklch(0.55_0.17_260)] text-white"
            >
              Add Trace
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
