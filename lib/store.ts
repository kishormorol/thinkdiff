import { create } from "zustand";
import { TraceResult, StructuredTrace } from "./parser/types";

interface ThinkDiffState {
  prompt: string;
  selectedModels: string[];
  isExecuting: boolean;
  rawResults: TraceResult[];
  structuredTraces: StructuredTrace[];
  error: string | null;

  setPrompt: (prompt: string) => void;
  toggleModel: (modelId: string) => void;
  setExecuting: (executing: boolean) => void;
  setRawResults: (results: TraceResult[]) => void;
  setStructuredTraces: (traces: StructuredTrace[]) => void;
  setError: (error: string | null) => void;
  addPastedTrace: (trace: TraceResult) => void;
  reset: () => void;
}

export const useStore = create<ThinkDiffState>((set) => ({
  prompt: "",
  selectedModels: ["claude-sonnet", "deepseek-r1"],
  isExecuting: false,
  rawResults: [],
  structuredTraces: [],
  error: null,

  setPrompt: (prompt) => set({ prompt }),
  toggleModel: (modelId) =>
    set((state) => ({
      selectedModels: state.selectedModels.includes(modelId)
        ? state.selectedModels.filter((m) => m !== modelId)
        : [...state.selectedModels, modelId],
    })),
  setExecuting: (isExecuting) => set({ isExecuting }),
  setRawResults: (rawResults) => set({ rawResults }),
  setStructuredTraces: (structuredTraces) => set({ structuredTraces }),
  setError: (error) => set({ error }),
  addPastedTrace: (trace) =>
    set((state) => ({
      rawResults: [...state.rawResults, trace],
    })),
  reset: () =>
    set({
      rawResults: [],
      structuredTraces: [],
      error: null,
    }),
}));
