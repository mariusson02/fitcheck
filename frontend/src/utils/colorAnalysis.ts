import chroma from 'chroma-js';

export type PaletteEntry = { color: string; count: number; percent: number };
export type PaletteResult = {
  palette: string[]; // hex colors, sorted by dominance
  detailed: PaletteEntry[]; // counts and percentages
  dominant: string;
  avgPairwiseLabDistance: number;
  complementaryPairs: Array<[string, string]>;
};

/** Euclidean distance in Lab color space */
function labDistance(a: number[], b: number[]) {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Sample pixels from a canvas and extract a simple palette.
 * - samples step pixels (to speed up)
 * - quantizes RGB to reduce near-duplicates
 */
export function getPaletteFromCanvas(
  canvas: HTMLCanvasElement,
  options: { paletteSize?: number; sampleStep?: number; quantize?: number } = {}
): PaletteResult {
  const { paletteSize = 5, sampleStep = 4, quantize = 16 } = options;
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const counts = new Map<string, number>();
  let total = 0;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 128) continue; // skip transparent pixels (background removed)
      // quantize
      const r = Math.round((data[i] / 255) * (quantize - 1));
      const g = Math.round((data[i + 1] / 255) * (quantize - 1));
      const b = Math.round((data[i + 2] / 255) * (quantize - 1));
      const key = `${r}_${g}_${b}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      total++;
    }
  }

  const detailed: PaletteEntry[] = Array.from(counts.entries())
    .map(([key, count]) => {
      const [rq, gq, bq] = key.split('_').map(Number);
      const r = Math.round((rq / (quantize - 1)) * 255);
      const g = Math.round((gq / (quantize - 1)) * 255);
      const b = Math.round((bq / (quantize - 1)) * 255);
      const hex = chroma.rgb(r, g, b).hex();
      return { color: hex, count, percent: count / total };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, paletteSize);

  const palette = detailed.map((d) => d.color);
  const dominant = palette[0] ?? '#000000';

  const labs = palette.map((c) => chroma(c).lab());
  let pairCount = 0;
  let sumDist = 0;
  const complementaryPairs: Array<[string, string]> = [];
  for (let i = 0; i < palette.length; i++) {
    for (let j = i + 1; j < palette.length; j++) {
      const d = labDistance(labs[i], labs[j]);
      sumDist += d;
      pairCount++;
      const h1 = chroma(palette[i]).hsl()[0] ?? 0;
      const h2 = chroma(palette[j]).hsl()[0] ?? 0;
      const hueDiff = Math.abs(((h1 - h2 + 180 + 360) % 360) - 180);
      if (Math.abs(hueDiff - 180) < 20) complementaryPairs.push([palette[i], palette[j]]);
    }
  }
  const avgPairwiseLabDistance = pairCount > 0 ? sumDist / pairCount : 0;

  return { palette, detailed, dominant, avgPairwiseLabDistance, complementaryPairs };
}

/**
 * Score palette: heuristics combining diversity and contrast
 * - returns a 0..1 score (1 = very good variety/contrast)
 */
export function scorePalette(result: PaletteResult) {
  const scaled = Math.min(result.avgPairwiseLabDistance / 40, 1);
  const topPercent = result.detailed[0]?.percent ?? 0;
  const dominancePenalty = Math.max(0, (topPercent - 0.4) / 0.6);
  const score = Math.max(0, scaled * (1 - dominancePenalty));
  return { score, scaled, dominancePenalty };
}
