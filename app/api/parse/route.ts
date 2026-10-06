import { NextRequest, NextResponse } from "next/server";
import { parseTrace } from "@/lib/parser/llm-parser";
import { TraceResult } from "@/lib/parser/types";

export async function POST(request: NextRequest) {
  const { prompt, results } = (await request.json()) as {
    prompt: string;
    results: TraceResult[];
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY required for trace parsing" },
      { status: 400 }
    );
  }

  if (!prompt || !results?.length) {
    return NextResponse.json(
      { error: "prompt and results are required" },
      { status: 400 }
    );
  }

  const traces = await Promise.all(
    results.map((r) => parseTrace(r, prompt, apiKey))
  );

  return NextResponse.json({ traces });
}
