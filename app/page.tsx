import { PromptInput } from "@/components/prompt-input";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Open Source Research Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">
          <span className="bg-gradient-to-r from-[oklch(0.75_0.18_260)] via-[oklch(0.8_0.15_195)] to-[oklch(0.75_0.18_260)] bg-clip-text text-transparent">
            Think
          </span>
          <span className="text-foreground/40">Diff</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
          See how different LLMs reason about the same problem.
          <br />
          <span className="text-foreground/60">Where they diverge. Where they backtrack. Where they decide.</span>
        </p>
      </div>
      <PromptInput />
    </main>
  );
}
