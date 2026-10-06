import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import { TraceResult } from "@/lib/parser/types";

export async function POST(request: NextRequest) {
  const { prompt, models } = (await request.json()) as {
    prompt: string;
    models: string[];
  };

  if (!prompt || !models?.length) {
    return NextResponse.json(
      { error: "prompt and models are required" },
      { status: 400 }
    );
  }

  const results: TraceResult[] = await Promise.all(
    models.map(async (modelId) => {
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
