import { NextRequest, NextResponse } from "next/server";
import { parseTrace } from "@/lib/parser/llm-parser";
import { TraceResult } from "@/lib/parser/types";

export async function POST(request: NextRequest) {
  let body: { prompt?: string; results?: TraceResult[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { prompt, results } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY required for trace parsing" },
      { status: 400 }
    );
  }

  if (typeof prompt !== "string" || !Array.isArray(results) || !results.length) {
    return NextResponse.json(
      { error: "prompt and results are required" },
      { status: 400 }
    );
  }

  try {
    const traces = await Promise.all(
      results.map((r) => parseTrace(r, prompt, apiKey))
    );
    return NextResponse.json({ traces });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse traces" },
      { status: 502 }
    );
  }
}
