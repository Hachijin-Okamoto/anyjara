import type { Tile } from '@/entity/Tile';
import type { YakuRule, RuleDefinition } from './ruleModule';

export type AiStrategy = {
  id: string;
  name: string;
  decideDiscard: (
    hand: Tile[],
    rule: RuleDefinition,
    context?: AiStrategyContext,
  ) => string | null;
};

export type AiStrategyContext = {
  discards: Record<number, Tile[]>;
  lastReach: number | null;
  isReached: Record<number, boolean>;
};

export const AI_STRATEGIES: AiStrategy[] = [
  {
    id: 'human',
    name: '人間操作',
    decideDiscard: () => null,
  },
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
  {
    id: 'avoid-dealin',
    name: '放銃回避',
    decideDiscard: (hand, rule, context) =>
      chooseDiscardByDealInAvoidance(hand, rule, context),
  },
  {
    id: 'agari-priority',
    name: '上がり優先',
    decideDiscard: (hand, rule) => chooseDiscardByAgariPriority(hand, rule),
  },
  {
    id: 'high-score',
    name: '高得点優先',
    decideDiscard: (hand, rule) => chooseDiscardByHighScoreFocus(hand, rule),
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

function scoreHandForYakus(
  hand: Tile[],
  rule: RuleDefinition,
  yakusOverride?: YakuRule[],
): number {
  const yakus = yakusOverride ?? rule.yakus ?? [];
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

function getMinimumMissingForYakus(
  hand: Tile[],
  rule: RuleDefinition,
  yakusOverride?: YakuRule[],
): number | null {
  const yakus = yakusOverride ?? rule.yakus ?? [];
  if (yakus.length === 0) return null;

  const counts = buildCounts(hand);
  const nameToColorId = new Map<string, string>();
  for (const tile of rule.tiles) {
    nameToColorId.set(tile.id, tile.colorId);
  }

  return yakus.reduce(
    (min, yaku) => {
      const missing = calculateMissingForYaku(yaku, counts, nameToColorId);
      if (min === null) return missing;
      return Math.min(min, missing);
    },
    null as number | null,
  );
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

function chooseDiscardByDealInAvoidance(
  hand: Tile[],
  rule: RuleDefinition,
  context?: AiStrategyContext,
): string | null {
  if (hand.length === 0) return null;

  const reacher = context?.lastReach;
  const reacherDiscards =
    reacher !== null && reacher !== undefined
      ? (context?.discards?.[reacher] ?? [])
      : [];
  if (reacherDiscards.length > 0) {
    for (let i = reacherDiscards.length - 1; i >= 0; i--) {
      const safeCandidate = hand.find(
        (tile) => tile.name === reacherDiscards[i].name,
      );
      if (safeCandidate) return safeCandidate.id;
    }
  }

  return chooseDiscardByYakuProgress(hand, rule);
}

function getWinHandSize(rule: RuleDefinition): number {
  return rule.winHandSize ?? rule.handSize + 1;
}

function makeTileFromRule(
  tileRule: RuleDefinition['tiles'][number],
  suffix: string,
): Tile {
  return {
    id: `${tileRule.id}-${suffix}`,
    name: tileRule.id,
    label: tileRule.label,
    colorId: tileRule.colorId,
    colorCode: tileRule.colorCode,
  };
}

function evaluateYaku(hand: Tile[], rule: RuleDefinition): { isWon: boolean } {
  const nameCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  for (const t of hand) {
    nameCounts.set(t.name, (nameCounts.get(t.name) ?? 0) + 1);
    colorCounts.set(t.colorId, (colorCounts.get(t.colorId) ?? 0) + 1);
  }

  const nameToColorId = new Map<string, string>();
  for (const tile of rule.tiles) {
    nameToColorId.set(tile.id, tile.colorId);
  }

  const yakus = rule.yakus ?? [];

  const takeFromMap = (
    map: Map<string, number>,
    key: string,
    count: number,
  ) => {
    const current = map.get(key) ?? 0;
    if (current < count) return false;
    map.set(key, current - count);
    return true;
  };

  for (const yaku of yakus) {
    const remainingNameCounts = new Map(nameCounts);
    const remainingColorCounts = new Map(colorCounts);
    const anyColorRequirements: number[] = [];
    let achieved = true;

    const requirements = yaku.required ?? [];
    const nameRequirements = requirements.filter((req) => req.name);
    const colorRequirements = requirements.filter(
      (req) => !req.name && req.color,
    );

    for (const req of nameRequirements) {
      if (!req.name) continue;
      if (!takeFromMap(remainingNameCounts, req.name, req.count)) {
        achieved = false;
        break;
      }
      const colorId = nameToColorId.get(req.name);
      if (colorId && !takeFromMap(remainingColorCounts, colorId, req.count)) {
        achieved = false;
        break;
      }
    }

    if (achieved) {
      for (const req of colorRequirements) {
        if (!req.color) continue;
        if (req.color === 'any') {
          anyColorRequirements.push(req.count);
        } else if (!takeFromMap(remainingColorCounts, req.color, req.count)) {
          achieved = false;
          break;
        }
      }
    }

    if (achieved && anyColorRequirements.length > 0) {
      const availableColors = Array.from(remainingColorCounts.entries())
        .filter(([, count]) => count > 0)
        .map(([colorId, count]) => ({ colorId, count }));
      const sortedRequirements = [...anyColorRequirements].sort(
        (a, b) => b - a,
      );

      for (const reqCount of sortedRequirements) {
        let bestIndex = -1;
        let bestCount = Infinity;
        for (let i = 0; i < availableColors.length; i++) {
          const candidate = availableColors[i];
          if (candidate.count >= reqCount && candidate.count < bestCount) {
            bestIndex = i;
            bestCount = candidate.count;
          }
        }
        if (bestIndex === -1) {
          achieved = false;
          break;
        }
        availableColors.splice(bestIndex, 1);
      }
    }

    if (achieved) {
      return { isWon: true };
    }
  }

  return { isWon: false };
}

function canWin(hand: Tile[], rule: RuleDefinition): boolean {
  return evaluateYaku(hand, rule).isWon;
}

function getTempaiWaits(hand: Tile[], rule: RuleDefinition): string[] {
  const winHandSize = getWinHandSize(rule);
  if (hand.length !== winHandSize - 1) return [];
  const waits: string[] = [];
  for (const tileRule of rule.tiles) {
    const tile = makeTileFromRule(tileRule, 'wait');
    if (canWin([...hand, tile], rule)) {
      waits.push(tileRule.id);
    }
  }
  return waits;
}

function chooseDiscardByAgariPriority(
  hand: Tile[],
  rule: RuleDefinition,
): string | null {
  if (hand.length === 0) return null;

  let bestTileId = hand[0].id;
  let bestScore = -Infinity;

  for (const tile of hand) {
    const remaining = hand.filter((t) => t.id !== tile.id);
    const waits = getTempaiWaits(remaining, rule);
    const minMissing = getMinimumMissingForYakus(remaining, rule);
    const score = waits.length > 0 ? 1000 + waits.length : -(minMissing ?? 0);
    if (score > bestScore) {
      bestScore = score;
      bestTileId = tile.id;
    }
  }

  return bestTileId;
}

function chooseDiscardByHighScoreFocus(
  hand: Tile[],
  rule: RuleDefinition,
): string | null {
  if (hand.length === 0) return null;

  const highYakus = (rule.yakus ?? []).filter(
    (yaku) => (yaku.point ?? 0) > 100000,
  );
  if (highYakus.length === 0) {
    const idx = Math.floor(Math.random() * hand.length);
    return hand[idx].id;
  }

  let bestTileId = hand[0].id;
  let bestScore = -Infinity;

  for (const tile of hand) {
    const remaining = hand.filter((t) => t.id !== tile.id);
    const score = scoreHandForYakus(remaining, rule, highYakus);
    if (score > bestScore) {
      bestScore = score;
      bestTileId = tile.id;
    }
  }

  return bestTileId;
}
