import type { Tile } from '@/entity/Tile';
import type { YakuRule, RuleDefinition } from './ruleModule';

type AiStrategy = {
  id: string;
  name: string;
  decideDiscard: (hand: Tile[], rule: RuleDefinition) => string | null;
};

export const AI_STRATEGIES: AiStrategy[] = [
  {
    id: 'random',
    name: 'ランダム',
    decideDiscard: (hand) => {
      if (hand.length === 0) return null;
      const idx = Math.floor(Math.random() * hand.length);
      return hand[idx].id;
    },
  },
  {
    id: 'yaku-progress',
    name: '役優先',
    decideDiscard: (hand, rule) => chooseDiscardByYakuProgress(hand, rule),
  },
];

function buildCounts(hand: Tile[]): {
  nameCounts: Map<string, number>;
  colorCounts: Map<string, number>;
} {
  const nameCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  for (const t of hand) {
    nameCounts.set(t.name, (nameCounts.get(t.name) ?? 0) + 1);
    colorCounts.set(t.colorId, (colorCounts.get(t.colorId) ?? 0) + 1);
  }
  return { nameCounts, colorCounts };
}

function takePartial(
  map: Map<string, number>,
  key: string,
  count: number,
): number {
  const current = map.get(key) ?? 0;
  const taken = Math.min(current, count);
  map.set(key, current - taken);
  return taken;
}

function calculateMissingForYaku(
  yaku: YakuRule,
  counts: { nameCounts: Map<string, number>; colorCounts: Map<string, number> },
  nameToColorId: Map<string, string>,
): number {
  const nameCounts = new Map(counts.nameCounts);
  const colorCounts = new Map(counts.colorCounts);
  const anyColorRequirements: number[] = [];
  let missing = 0;

  const requirements = yaku.required ?? [];
  const nameRequirements = requirements.filter((req) => req.name);
  const colorRequirements = requirements.filter(
    (req) => !req.name && req.color,
  );

  for (const req of nameRequirements) {
    if (!req.name) continue;
    const taken = takePartial(nameCounts, req.name, req.count);
    missing += req.count - taken;
    const colorId = nameToColorId.get(req.name);
    if (colorId) {
      takePartial(colorCounts, colorId, taken);
    }
  }

  for (const req of colorRequirements) {
    if (!req.color) continue;
    if (req.color === 'any') {
      anyColorRequirements.push(req.count);
    } else {
      const taken = takePartial(colorCounts, req.color, req.count);
      missing += req.count - taken;
    }
  }

  if (anyColorRequirements.length > 0) {
    const availableColors = Array.from(colorCounts.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([colorId, count]) => ({ colorId, count }));
    const sortedRequirements = [...anyColorRequirements].sort((a, b) => b - a);

    for (const reqCount of sortedRequirements) {
      const best = availableColors.shift();
      if (!best) {
        missing += reqCount;
        continue;
      }
      const taken = Math.min(best.count, reqCount);
      missing += reqCount - taken;
    }
  }

  return missing;
}

function scoreHandForYakus(hand: Tile[], rule: RuleDefinition): number {
  const yakus = rule.yakus ?? [];
  if (yakus.length === 0) return 0;

  const counts = buildCounts(hand);
  const nameToColorId = new Map<string, string>();
  for (const tile of rule.tiles) {
    nameToColorId.set(tile.id, tile.colorId);
  }

  return yakus.reduce((sum, yaku) => {
    const missing = calculateMissingForYaku(yaku, counts, nameToColorId);
    const points = yaku.point ?? 0;
    return sum + points / (missing + 1);
  }, 0);
}

function chooseDiscardByYakuProgress(
  hand: Tile[],
  rule: RuleDefinition,
): string | null {
  if (hand.length === 0) return null;

  let bestTileId = hand[0].id;
  let bestScore = -Infinity;

  for (const tile of hand) {
    const remaining = hand.filter((t) => t.id !== tile.id);
    const score = scoreHandForYakus(remaining, rule);
    if (score > bestScore) {
      bestScore = score;
      bestTileId = tile.id;
    }
  }

  return bestTileId;
}
