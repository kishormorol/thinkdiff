import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import { MODEL_OPTIONS } from "@/lib/providers/types";
import { TraceResult } from "@/lib/parser/types";

const MAX_PROMPT_LENGTH = 20_000;
const KNOWN_MODELS = new Set(MODEL_OPTIONS.map((m) => m.id));

export async function POST(request: NextRequest) {
  let body: { prompt?: unknown; models?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { prompt, models } = body;

  if (typeof prompt !== "string" || !prompt.trim() || !Array.isArray(models) || !models.length) {
    return NextResponse.json(
      { error: "prompt and models are required" },
      { status: 400 }
    );
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `prompt must be at most ${MAX_PROMPT_LENGTH} characters` },
      { status: 400 }
    );
  }

  const unknown = models.filter((m) => typeof m !== "string" || !KNOWN_MODELS.has(m));
  if (unknown.length) {
    return NextResponse.json(
      { error: `Unknown model(s): ${unknown.join(", ")}` },
      { status: 400 }
    );
  }

  const results: TraceResult[] = await Promise.all(
    [...new Set(models as string[])].map(async (modelId) => {
      const provider = getProvider(modelId);
      if (!provider) {
        return {
          model: modelId,
          rawTrace: "",
          answer: "",
          totalTokens: 0,
          totalTimeMs: 0,
          error: `No API key configured for ${modelId}`,
        } satisfies TraceResult;
      }

      try {
        return await provider.execute(prompt);
      } catch (err) {
        return {
          model: modelId,
          rawTrace: "",
          answer: "",
          totalTokens: 0,
          totalTimeMs: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        } satisfies TraceResult;
      }
    })
  );

  return NextResponse.json({ prompt, results });
}
