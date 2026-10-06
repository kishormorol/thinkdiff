import { StructuredTrace, Phase, PhaseType } from "./types";

/**
 * Aligned row: one entry per trace, null if that trace has no matching phase.
 * This powers the side-by-side comparison view.
 */
export interface AlignedRow {
  type: PhaseType;
  label: string;
  phases: (Phase | null)[];
}

/**
 * Align phases across multiple traces by phase type.
 *
 * Strategy: build a merged ordering of phase types that preserves
 * each trace's original sequence as much as possible, then slot
 * each trace's phases into the merged order.
 */
export function alignTraces(traces: StructuredTrace[]): AlignedRow[] {
  if (traces.length === 0) return [];
  if (traces.length === 1) {
    return traces[0].phases.map((p) => ({
      type: p.type,
      label: p.label,
      phases: [p],
    }));
  }

  // Build merged phase type order using all traces
  const mergedOrder = buildMergedOrder(traces.map((t) => t.phases));

  // Slot each trace's phases into the merged order
  const rows: AlignedRow[] = mergedOrder.map((entry) => ({
    type: entry.type,
    label: entry.label,
    phases: new Array(traces.length).fill(null),
  }));

  for (let ti = 0; ti < traces.length; ti++) {
    const phases = [...traces[ti].phases];
    let cursor = 0;

    for (const phase of phases) {
      // Find the next matching row at or after cursor
      let found = false;
      for (let ri = cursor; ri < rows.length; ri++) {
        if (rows[ri].type === phase.type && rows[ri].phases[ti] === null) {
          rows[ri].phases[ti] = phase;
          cursor = ri + 1;
          found = true;
          break;
        }
      }
      // If no match found, append a new row
      if (!found) {
        rows.push({
          type: phase.type,
          label: phase.label,
          phases: traces.map((_, i) => (i === ti ? phase : null)),
        });
      }
    }
  }

  return rows;
}

interface OrderEntry {
  type: PhaseType;
  label: string;
}

function buildMergedOrder(phaseLists: Phase[][]): OrderEntry[] {
  const result: OrderEntry[] = [];
  const seen = new Set<string>();

  // Interleave: walk all lists in parallel, adding unseen types
  const cursors = phaseLists.map(() => 0);
  let progress = true;

  while (progress) {
    progress = false;
    for (let li = 0; li < phaseLists.length; li++) {
      if (cursors[li] < phaseLists[li].length) {
        const phase = phaseLists[li][cursors[li]];
        const key = `${phase.type}-${result.length}`;

        // Allow duplicate phase types (e.g. multiple backtracks)
        // by using a position-aware key for dedup within same pass
        if (!seen.has(`${phase.type}-${cursors[li]}-${li}`)) {
          // Check if this type already exists in result at this position
          const existingIdx = result.findIndex(
            (r, i) => r.type === phase.type && i >= result.length - phaseLists.length
          );

          if (existingIdx === -1 || phase.type === "backtrack") {
            result.push({ type: phase.type, label: phase.label });
          }
          seen.add(key);
        }

        cursors[li]++;
        progress = true;
      }
    }
  }

  return result;
}

/**
 * Compute a simple divergence score between two traces.
 * Higher score = more different reasoning approaches.
 */
export function divergenceScore(a: StructuredTrace, b: StructuredTrace): number {
  let score = 0;

  // Phase count difference
  score += Math.abs(a.phases.length - b.phases.length) * 10;

  // Phase type distribution difference
  const aTypes = phaseTypeDistribution(a);
  const bTypes = phaseTypeDistribution(b);
  const allTypes = new Set([...Object.keys(aTypes), ...Object.keys(bTypes)]);
  for (const type of allTypes) {
    score += Math.abs((aTypes[type] || 0) - (bTypes[type] || 0)) * 20;
  }

  // Backtrack count difference (weighted heavily)
  const aBacktracks = a.phases.filter((p) => p.type === "backtrack").length;
  const bBacktracks = b.phases.filter((p) => p.type === "backtrack").length;
  score += Math.abs(aBacktracks - bBacktracks) * 30;

  // Token distribution difference
  const aTokenRatio = a.totalTokens > 0 ? tokenRatio(a) : {};
  const bTokenRatio = b.totalTokens > 0 ? tokenRatio(b) : {};
  for (const type of allTypes) {
    score +=
      Math.abs((aTokenRatio[type] || 0) - (bTokenRatio[type] || 0)) * 50;
  }

  return Math.round(score);
}

function phaseTypeDistribution(
  trace: StructuredTrace
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const p of trace.phases) {
    dist[p.type] = (dist[p.type] || 0) + 1;
  }
  // Normalize
  const total = trace.phases.length || 1;
  for (const k of Object.keys(dist)) {
    dist[k] /= total;
  }
  return dist;
}

function tokenRatio(trace: StructuredTrace): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const p of trace.phases) {
    dist[p.type] = (dist[p.type] || 0) + p.tokenCount;
  }
  const total = trace.totalTokens || 1;
  for (const k of Object.keys(dist)) {
    dist[k] /= total;
  }
  return dist;
}
