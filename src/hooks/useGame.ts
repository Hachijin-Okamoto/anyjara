import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { type Tile } from '@/entity/Tile';
import { type RuleDefinition, type YakuRule, rules } from './ruleModule';
import { type AiStrategy, AI_STRATEGIES } from './strategy';

export type PlayerId = 0 | 1 | 2 | 3;

type Phase = 'idle' | 'draw' | 'discard' | 'end';

export type YakuEvaluationResult = {
  isWon: boolean;
  totalPoints: number;
  achievedYakus: YakuRule[];
  bestYaku: YakuRule | null;
};

export type EvaluationState = {
  isRunning: boolean;
  targetGames: number;
  totalGames: number;
  draws: number;
  speedMode: EvaluationSpeedMode;
  rankCounts: Record<
    PlayerId,
    { first: number; second: number; third: number; fourth: number }
  >;
  totalFinalScores: Record<PlayerId, number>;
  rule: RuleDefinition;
};

export type EvaluationSpeedMode = 'normal' | 'fast-cpu' | 'instant';

export type GameState = {
  wall: Tile[];
  hands: Record<PlayerId, Tile[]>;
  discards: Record<PlayerId, Tile[]>;
  lastTsumo: Record<PlayerId, string | null>;
  isTempai: Record<PlayerId, boolean>;
  isReached: Record<PlayerId, boolean>;
  reachPending: Record<PlayerId, boolean>;
  reachDiscardIds: Record<PlayerId, string | null>;
  lastReach: PlayerId | null;
  score: Record<PlayerId, number>;
  dealer: PlayerId;
  initialDealer: PlayerId;
  dealerCycles: number;
  handCount: number;
  setOver: boolean;
  turn: PlayerId;
  phase: Phase;
  log: string[];
  rule: RuleDefinition;
  drawInfo: {
    reason: 'exhausted';
  } | null;
  winInfo: {
    playerId: PlayerId;
    points: number;
    yakuNames: string[];
    hand: Tile[];
    winType: 'tsumo' | 'ron';
  } | null;
};

type Action =
  | { type: 'START_GAME'; rule: RuleDefinition }
  | { type: 'DRAW' }
  | { type: 'DISCARD'; tileId: string }
  | { type: 'DECLARE_REACH' };

const DEFAULT_RULE_DEF = rules[0];

const PLAYER_IDS: PlayerId[] = [0, 1, 2, 3];
export const HUMAN: PlayerId = 0;

const PLAYER_STRATEGIES_DEFAULT: Record<PlayerId, string> = {
  0: 'human',
  1: 'yaku-progress',
  2: 'yaku-progress',
  3: 'yaku-progress',
};

const NON_HUMAN_STRATEGIES = AI_STRATEGIES.filter(
  (strategy) => strategy.id !== 'human',
);
const DEFAULT_AI_STRATEGY = NON_HUMAN_STRATEGIES[0] ?? AI_STRATEGIES[0];

const INITIAL_EVALUATION: EvaluationState = {
  isRunning: false,
  targetGames: 100,
  totalGames: 0,
  draws: 0,
  speedMode: 'normal',
  rankCounts: {
    0: { first: 0, second: 0, third: 0, fourth: 0 },
    1: { first: 0, second: 0, third: 0, fourth: 0 },
    2: { first: 0, second: 0, third: 0, fourth: 0 },
    3: { first: 0, second: 0, third: 0, fourth: 0 },
  },
  totalFinalScores: { 0: 0, 1: 0, 2: 0, 3: 0 },
  rule: DEFAULT_RULE_DEF,
};

// stateの初期値用
const INITIAL: GameState = {
  wall: [],
  hands: { 0: [], 1: [], 2: [], 3: [] },
  discards: { 0: [], 1: [], 2: [], 3: [] },
  lastTsumo: { 0: null, 1: null, 2: null, 3: null },
  isTempai: { 0: false, 1: false, 2: false, 3: false },
  isReached: { 0: false, 1: false, 2: false, 3: false },
  reachPending: { 0: false, 1: false, 2: false, 3: false },
  reachDiscardIds: { 0: null, 1: null, 2: null, 3: null },
  lastReach: null,
  score: { 0: 0, 1: 0, 2: 0, 3: 0 },
  dealer: 0,
  initialDealer: 0,
  dealerCycles: 0,
  handCount: 0,
  setOver: false,
  turn: 0,
  phase: 'idle',
  log: ['「Start Game」で開始'],
  rule: DEFAULT_RULE_DEF,
  drawInfo: null,
  winInfo: null,
};

/**
 * ルールに基づいてタイル情報を渡して山を作る
 * @returns タイルの配列（シャッフルされていないので毎回同じ）
 */
function makeWall(rule: RuleDefinition): Tile[] {
  const tiles: Tile[] = [];
  for (const c of rule.tiles) {
    for (let i = 1; i <= c.copies; i++) {
      tiles.push({
        id: `${c.id}-${i}`,
        name: c.id,
        label: c.label,
        colorId: c.colorId,
        colorCode: c.colorCode,
      });
    }
  }
  return tiles;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 1つツモる
 * @returns wallはツモった後の山
 */
function drawOne(wall: Tile[]): { tile: Tile | null; wall: Tile[] } {
  if (wall.length === 0) return { tile: null, wall };
  const [top, ...rest] = wall;
  return { tile: top, wall: rest };
}

function sortHand(hand: Tile[]): Tile[] {
  const key = (t: Tile) => `${t.label}-${t.id}`;
  return [...hand].sort((x, y) => key(x).localeCompare(key(y)));
}

function getStrategyById(id: string): AiStrategy {
  if (id === 'human') return DEFAULT_AI_STRATEGY;
  return (
    AI_STRATEGIES.find((strategy) => strategy.id === id) ?? DEFAULT_AI_STRATEGY
  );
}

function evaluateYaku(
  hand: Tile[],
  rule: RuleDefinition,
): YakuEvaluationResult {
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

  const achievedYakus: YakuRule[] = [];
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
      achievedYakus.push(yaku);
    }
  }

  const bestYaku =
    achievedYakus.length > 0
      ? achievedYakus.reduce((best, current) =>
          current.point > best.point ? current : best,
        )
      : null;
  const totalPoints = bestYaku?.point ?? 0;

  return { isWon: totalPoints > 0, totalPoints, achievedYakus, bestYaku };
}

function canWin(
  hand: Tile[],
  rule: RuleDefinition,
): { achieved: boolean; results: YakuEvaluationResult } {
  const evaluationResult = evaluateYaku(hand, rule);
  return { achieved: evaluationResult.isWon, results: evaluationResult };
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

function getTempaiWaits(hand: Tile[], rule: RuleDefinition): string[] {
  const winHandSize = getWinHandSize(rule);
  if (hand.length !== winHandSize - 1) return [];
  const waits: string[] = [];
  for (const tileRule of rule.tiles) {
    const tile = makeTileFromRule(tileRule, 'wait');
    if (canWin([...hand, tile], rule).achieved) {
      waits.push(tileRule.id);
    }
  }
  return waits;
}

function isTempai(hand: Tile[], rule: RuleDefinition): boolean {
  return getTempaiWaits(hand, rule).length > 0;
}

function getReachDiscardIds(hand: Tile[], rule: RuleDefinition): string[] {
  const winHandSize = getWinHandSize(rule);
  if (hand.length !== winHandSize) return [];
  const discardIds: string[] = [];
  for (let i = 0; i < hand.length; i++) {
    const remaining = [...hand.slice(0, i), ...hand.slice(i + 1)];
    if (isTempai(remaining, rule)) {
      discardIds.push(hand[i].id);
    }
  }
  return discardIds;
}

function buildTempaiState(
  hands: Record<PlayerId, Tile[]>,
  rule: RuleDefinition,
): Record<PlayerId, boolean> {
  return {
    0: isTempai(hands[0], rule),
    1: isTempai(hands[1], rule),
    2: isTempai(hands[2], rule),
    3: isTempai(hands[3], rule),
  };
}

function nextPlayer(turn: PlayerId): PlayerId {
  const idx = PLAYER_IDS.indexOf(turn);
  const next = (idx + 1) % PLAYER_IDS.length;
  return PLAYER_IDS[next];
}

function chooseRandomDealer(): PlayerId {
  const index = Math.floor(Math.random() * PLAYER_IDS.length);
  return PLAYER_IDS[index];
}

function adjustScoresOnWin(
  scores: Record<PlayerId, number>,
  winner: PlayerId,
  winType: 'tsumo' | 'ron',
  points: number,
  discarder?: PlayerId,
): Record<PlayerId, number> {
  const nextScores = { ...scores };
  if (winType === 'tsumo') {
    const share = Math.floor(points / 3);
    const remainder = points - share * 3;
    for (const playerId of PLAYER_IDS) {
      if (playerId === winner) continue;
      nextScores[playerId] -= share;
    }
    nextScores[winner] += share * 3 + remainder;
  } else if (discarder !== undefined) {
    nextScores[winner] += points;
    nextScores[discarder] -= points;
  }
  return nextScores;
}

function advanceDealerAfterHand(
  current: GameState,
  winner: PlayerId | null,
): Pick<GameState, 'dealer' | 'dealerCycles' | 'setOver'> {
  let dealer = current.dealer;
  let dealerCycles = current.dealerCycles;
  if (winner === null || winner !== current.dealer) {
    dealer = nextPlayer(current.dealer);
    if (dealer === current.initialDealer) {
      dealerCycles += 1;
    }
  }
  const setOver = dealerCycles >= 2;
  return { dealer, dealerCycles, setOver };
}

function buildRankings(scores: Record<PlayerId, number>): PlayerId[] {
  return [...PLAYER_IDS].sort((a, b) => {
    const diff = scores[b] - scores[a];
    if (diff !== 0) return diff;
    return a - b;
  });
}

function findRonWinnerFromHands(
  hands: Record<PlayerId, Tile[]>,
  rule: RuleDefinition,
  discarder: PlayerId,
  discardedTile: Tile,
): { winner: PlayerId; results: YakuEvaluationResult } | null {
  let current = discarder;
  for (let i = 0; i < PLAYER_IDS.length - 1; i++) {
    current = nextPlayer(current);
    const hand = hands[current];
    const checkHand = sortHand([...hand, discardedTile]);
    const winCheck = canWin(checkHand, rule);
    if (winCheck.achieved) {
      return { winner: current, results: winCheck.results };
    }
  }
  return null;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const rule = action.rule;
      const isNewSet = state.handCount === 0 || state.setOver;
      const dealer = isNewSet ? chooseRandomDealer() : state.dealer;
      const initialDealer = isNewSet ? dealer : state.initialDealer;
      const dealerCycles = isNewSet ? 0 : state.dealerCycles;
      const handCount = isNewSet ? 1 : state.handCount + 1;
      const score = isNewSet
        ? {
            0: action.rule.initialScore,
            1: action.rule.initialScore,
            2: action.rule.initialScore,
            3: action.rule.initialScore,
          }
        : state.score;
      const wall = shuffle(makeWall(rule));
      let w = wall;
      const hands: Record<PlayerId, Tile[]> = { 0: [], 1: [], 2: [], 3: [] };
      for (let i = 0; i < rule.handSize; i++) {
        for (const p of PLAYER_IDS) {
          const d = drawOne(w);
          if (d.tile) hands[p].push(d.tile);
          w = d.wall;
        }
      }

      return {
        wall: w,
        hands: {
          0: sortHand(hands[0]),
          1: sortHand(hands[1]),
          2: sortHand(hands[2]),
          3: sortHand(hands[3]),
        },
        discards: { 0: [], 1: [], 2: [], 3: [] },
        lastTsumo: { 0: null, 1: null, 2: null, 3: null },
        isTempai: buildTempaiState(hands, rule),
        isReached: { 0: false, 1: false, 2: false, 3: false },
        reachPending: { 0: false, 1: false, 2: false, 3: false },
        reachDiscardIds: { 0: null, 1: null, 2: null, 3: null },
        lastReach: null,
        score,
        dealer,
        initialDealer,
        dealerCycles,
        handCount,
        setOver: false,
        turn: dealer,
        phase: 'draw',
        drawInfo: null,
        log: [
          ...(isNewSet ? ['セット開始。親は P' + dealer + '。'] : []),
          `ゲーム開始。P${dealer}（親）から。自動で1枚引きます。`,
        ],
        rule,
        winInfo: null,
      };
    }

    case 'DRAW': {
      if (state.phase !== 'draw') return state;

      const { tile, wall } = drawOne(state.wall);
      if (!tile) {
        const dealerInfo = advanceDealerAfterHand(state, null);
        return {
          ...state,
          phase: 'end',
          drawInfo: { reason: 'exhausted' },
          winInfo: null,
          dealer: dealerInfo.dealer,
          dealerCycles: dealerInfo.dealerCycles,
          setOver: dealerInfo.setOver,
          log: [
            ...state.log,
            '山が尽きました。流局。',
            dealerInfo.setOver
              ? '親が2周したためセット終了。'
              : '次ゲームは Start Game で開始。',
          ],
        };
      }

      const p = state.turn;
      const newHand = sortHand([...state.hands[p], tile]);
      const winCheck = canWin(newHand, state.rule);
      if (winCheck.achieved) {
        const yakuNames =
          winCheck.results.achievedYakus.length > 0
            ? winCheck.results.achievedYakus
                .map((yaku) => yaku.name)
                .join(' / ')
            : null;
        const nextScores = adjustScoresOnWin(
          state.score,
          p,
          'tsumo',
          winCheck.results.totalPoints,
        );
        const dealerInfo = advanceDealerAfterHand(state, p);
        return {
          ...state,
          wall,
          hands: { ...state.hands, [p]: newHand },
          lastTsumo: { ...state.lastTsumo, [p]: tile.id },
          isTempai: buildTempaiState(
            { ...state.hands, [p]: newHand },
            state.rule,
          ),
          score: nextScores,
          dealer: dealerInfo.dealer,
          dealerCycles: dealerInfo.dealerCycles,
          setOver: dealerInfo.setOver,
          phase: 'end',
          drawInfo: null,
          winInfo: {
            playerId: p,
            points: winCheck.results.totalPoints,
            yakuNames: winCheck.results.achievedYakus.map((yaku) => yaku.name),
            hand: newHand,
            winType: 'tsumo',
          },
          log: [
            ...state.log,
            `P${p} が ${tile.label} を引いた。役成立！得点 ${winCheck.results.totalPoints}.`,
            `成立役: ${yakuNames || 'なし'}`,
            dealerInfo.setOver
              ? '親が2周したためセット終了。'
              : '次ゲームは Start Game で開始。',
          ],
        };
      }

      return {
        ...state,
        wall,
        hands: { ...state.hands, [p]: newHand },
        lastTsumo: { ...state.lastTsumo, [p]: tile.id },
        isTempai: buildTempaiState(
          { ...state.hands, [p]: newHand },
          state.rule,
        ),
        phase: 'discard',
        log: [
          ...state.log,
          `P${p} が ${tile.label} を引いた。捨てる牌を選択。`,
        ],
      };
    }

    case 'DISCARD': {
      if (state.phase !== 'discard') return state;

      const p = state.turn;
      const hand = state.hands[p];
      if (state.isReached[p]) {
        const tsumoId = state.lastTsumo[p];
        if (!tsumoId || action.tileId !== tsumoId) return state;
      }
      if (state.reachPending[p]) {
        const reachDiscardIds = getReachDiscardIds(hand, state.rule);
        if (!reachDiscardIds.includes(action.tileId)) return state;
      }
      const idx = hand.findIndex((t) => t.id === action.tileId);
      if (idx < 0) return state;

      const tile = hand[idx];
      const newHand = [...hand.slice(0, idx), ...hand.slice(idx + 1)];
      const updatedHands = { ...state.hands, [p]: sortHand(newHand) };
      const reachDiscardIds = state.reachPending[p]
        ? { ...state.reachDiscardIds, [p]: tile.id }
        : state.reachDiscardIds;
      const ronResult = findRonWinnerFromHands(
        state.hands,
        state.rule,
        p,
        tile,
      );
      if (ronResult) {
        const { winner, results } = ronResult;
        const yakuNames =
          results.achievedYakus.length > 0
            ? results.achievedYakus.map((yaku) => yaku.name).join(' / ')
            : null;
        const winnerHand = sortHand([...state.hands[winner], tile]);
        const nextScores = adjustScoresOnWin(
          state.score,
          winner,
          'ron',
          results.totalPoints,
          p,
        );
        const dealerInfo = advanceDealerAfterHand(state, winner);
        return {
          ...state,
          hands: {
            ...state.hands,
            [p]: sortHand(newHand),
            [winner]: winnerHand,
          },
          discards: { ...state.discards, [p]: [...state.discards[p], tile] },
          lastTsumo: { ...state.lastTsumo, [winner]: tile.id, [p]: null },
          isTempai: buildTempaiState(
            {
              ...state.hands,
              [p]: sortHand(newHand),
              [winner]: winnerHand,
            },
            state.rule,
          ),
          reachPending: { ...state.reachPending, [p]: false },
          reachDiscardIds,
          isReached: state.reachPending[p]
            ? { ...state.isReached, [p]: true }
            : state.isReached,
          score: nextScores,
          dealer: dealerInfo.dealer,
          dealerCycles: dealerInfo.dealerCycles,
          setOver: dealerInfo.setOver,
          phase: 'end',
          drawInfo: null,
          winInfo: {
            playerId: winner,
            points: results.totalPoints,
            yakuNames: results.achievedYakus.map((yaku) => yaku.name),
            hand: winnerHand,
            winType: 'ron',
          },
          log: [
            ...state.log,
            `P${p} が ${tile.label} を捨てた。`,
            `P${winner} がロン！得点 ${results.totalPoints}.`,
            `成立役: ${yakuNames || 'なし'}`,
            dealerInfo.setOver
              ? '親が2周したためセット終了。'
              : '次ゲームは Start Game で開始。',
          ],
        };
      }

      const next = nextPlayer(p);

      return {
        ...state,
        hands: updatedHands,
        discards: { ...state.discards, [p]: [...state.discards[p], tile] },
        lastTsumo: { ...state.lastTsumo, [p]: null },
        isTempai: buildTempaiState(updatedHands, state.rule),
        reachPending: { ...state.reachPending, [p]: false },
        reachDiscardIds,
        isReached: state.reachPending[p]
          ? { ...state.isReached, [p]: true }
          : state.isReached,
        turn: next,
        phase: 'draw',
        log: [...state.log, `P${p} が ${tile.label} を捨てた。P${next} の番。`],
      };
    }

    case 'DECLARE_REACH': {
      if (state.phase !== 'discard') return state;
      const p = state.turn;
      if (state.isReached[p] || state.reachPending[p]) return state;
      const reachDiscardIds = getReachDiscardIds(state.hands[p], state.rule);
      if (reachDiscardIds.length === 0) return state;
      return {
        ...state,
        reachPending: { ...state.reachPending, [p]: true },
        lastReach: p,
        log: [...state.log, `P${p} がリーチ！`],
      };
    }

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [playerStrategyIds, setPlayerStrategyIds] = useState<
    Record<PlayerId, string>
  >(PLAYER_STRATEGIES_DEFAULT);
  const [evaluation, setEvaluation] =
    useState<EvaluationState>(INITIAL_EVALUATION);
  const lastPhaseRef = useRef<Phase | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  const evaluationTiming = useMemo(() => {
    if (!evaluation.isRunning) {
      return {
        drawDelayMs: 300,
        autoReachDelayMs: 300,
        cpuDiscardDelayMs: 500,
        autoAdvanceDelayMs: 1600,
      };
    }
    switch (evaluation.speedMode) {
      case 'fast-cpu':
      case 'instant':
        return {
          drawDelayMs: 0,
          autoReachDelayMs: 0,
          cpuDiscardDelayMs: 0,
          autoAdvanceDelayMs: 0,
        };
      default:
        return {
          drawDelayMs: 300,
          autoReachDelayMs: 300,
          cpuDiscardDelayMs: 500,
          autoAdvanceDelayMs: 1600,
        };
    }
  }, [evaluation.isRunning, evaluation.speedMode]);

  const canStart = state.phase === 'idle' || state.phase === 'end';
  const canDiscard =
    state.phase === 'discard' &&
    state.turn === HUMAN &&
    playerStrategyIds[HUMAN] === 'human';

  const evaluations = useMemo(() => {
    const results: Record<PlayerId, YakuEvaluationResult> = {
      0: evaluateYaku(state.hands[0], state.rule),
      1: evaluateYaku(state.hands[1], state.rule),
      2: evaluateYaku(state.hands[2], state.rule),
      3: evaluateYaku(state.hands[3], state.rule),
    };
    return results;
  }, [state.hands, state.rule]);

  const statusText = useMemo(() => {
    if (state.phase === 'idle') return 'Start Game で開始';
    if (state.phase === 'end') return '終了（Start Game で再開）';
    return `手番: P${state.turn} / フェーズ: ${state.phase}`;
  }, [state.phase, state.turn]);

  const reachDiscardIds = useMemo(() => {
    if (!canDiscard) return [];
    return getReachDiscardIds(state.hands[HUMAN], state.rule);
  }, [canDiscard, state.hands, state.rule]);

  const canReach = useMemo(() => {
    if (!canDiscard) return false;
    if (state.isReached[HUMAN] || state.reachPending[HUMAN]) return false;
    return reachDiscardIds.length > 0;
  }, [canDiscard, reachDiscardIds, state.isReached, state.reachPending]);

  const allowedDiscardIds = useMemo(() => {
    if (!canDiscard) return null;
    if (state.isReached[HUMAN]) {
      return state.lastTsumo[HUMAN]
        ? new Set([state.lastTsumo[HUMAN]])
        : new Set<string>();
    }
    if (state.reachPending[HUMAN]) {
      return new Set(reachDiscardIds);
    }
    return null;
  }, [
    canDiscard,
    reachDiscardIds,
    state.isReached,
    state.lastTsumo,
    state.reachPending,
  ]);

  /* ゲームを自動で動かす部分 */
  useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'end') return undefined;

    if (state.phase === 'draw') {
      if (evaluationTiming.drawDelayMs <= 0) {
        dispatch({ type: 'DRAW' });
        return undefined;
      }
      const timer = window.setTimeout(() => {
        dispatch({ type: 'DRAW' });
      }, evaluationTiming.drawDelayMs);
      return () => window.clearTimeout(timer);
    }

    const isHumanTurn =
      state.turn === HUMAN && playerStrategyIds[HUMAN] === 'human';
    if (state.phase === 'discard' && !isHumanTurn) {
      const hand = state.hands[state.turn];
      if (hand.length === 0) return undefined;
      if (!state.isReached[state.turn] && !state.reachPending[state.turn]) {
        const canAutoReach = getReachDiscardIds(hand, state.rule).length > 0;
        if (canAutoReach) {
          if (evaluationTiming.autoReachDelayMs <= 0) {
            dispatch({ type: 'DECLARE_REACH' });
            return undefined;
          }
          const timer = window.setTimeout(() => {
            dispatch({ type: 'DECLARE_REACH' });
          }, evaluationTiming.autoReachDelayMs);
          return () => window.clearTimeout(timer);
        }
      }
      const strategy = getStrategyById(playerStrategyIds[state.turn]);
      let tileId: string | undefined;
      if (state.isReached[state.turn]) {
        tileId = state.lastTsumo[state.turn] ?? undefined;
      } else if (state.reachPending[state.turn]) {
        const reachDiscardIds = getReachDiscardIds(hand, state.rule);
        tileId = reachDiscardIds[0];
      } else {
        tileId = strategy.decideDiscard(hand, state.rule, {
          discards: state.discards,
          lastReach: state.lastReach,
          isReached: state.isReached,
        });
      }
      if (!tileId) return undefined;
      if (evaluationTiming.cpuDiscardDelayMs <= 0) {
        dispatch({ type: 'DISCARD', tileId });
        return undefined;
      }
      const timer = window.setTimeout(() => {
        dispatch({ type: 'DISCARD', tileId });
      }, evaluationTiming.cpuDiscardDelayMs);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [
    state.phase,
    state.turn,
    state.hands,
    state.rule,
    state.isReached,
    state.reachPending,
    state.lastTsumo,
    playerStrategyIds,
    evaluationTiming,
  ]);

  useEffect(() => {
    if (!evaluation.isRunning) {
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      return undefined;
    }

    const phase = state.phase;
    const lastPhase = lastPhaseRef.current;
    lastPhaseRef.current = phase;

    if (phase === 'end' && lastPhase !== 'end') {
      if (state.drawInfo) {
        setEvaluation((prev) => {
          if (!prev.isRunning) return prev;
          return { ...prev, draws: prev.draws + 1 };
        });
      }

      if (state.setOver) {
        setEvaluation((prev) => {
          if (!prev.isRunning) return prev;
          const rankings = buildRankings(state.score);
          const rankCounts = { ...prev.rankCounts };
          rankings.forEach((playerId, index) => {
            const current = { ...rankCounts[playerId] };
            if (index === 0) current.first += 1;
            else if (index === 1) current.second += 1;
            else if (index === 2) current.third += 1;
            else current.fourth += 1;
            rankCounts[playerId] = current;
          });
          const totalFinalScores = { ...prev.totalFinalScores };
          for (const playerId of PLAYER_IDS) {
            totalFinalScores[playerId] += state.score[playerId];
          }
          const totalGames = prev.totalGames + 1;
          const isRunning = totalGames < prev.targetGames;
          return {
            ...prev,
            totalGames,
            isRunning,
            rankCounts,
            totalFinalScores,
          };
        });
      }
    }

    if (phase === 'idle' || phase === 'end') {
      const nextTotalGames = state.setOver
        ? evaluation.totalGames + 1
        : evaluation.totalGames;
      if (evaluation.isRunning && nextTotalGames < evaluation.targetGames) {
        if (autoAdvanceTimerRef.current !== null) {
          window.clearTimeout(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = null;
        }
        if (phase === 'end') {
          if (evaluationTiming.autoAdvanceDelayMs <= 0) {
            dispatch({ type: 'START_GAME', rule: evaluation.rule });
          } else {
            autoAdvanceTimerRef.current = window.setTimeout(() => {
              autoAdvanceTimerRef.current = null;
              dispatch({ type: 'START_GAME', rule: evaluation.rule });
            }, evaluationTiming.autoAdvanceDelayMs);
          }
        } else {
          dispatch({ type: 'START_GAME', rule: evaluation.rule });
        }
      }
    }
    return () => {
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [
    evaluation.isRunning,
    evaluation.targetGames,
    evaluation.totalGames,
    evaluation.rule,
    state.phase,
    state.winInfo,
    state.drawInfo,
    state.setOver,
    state.score,
    evaluationTiming,
  ]);

  // setCurrentRuleIndex(i)を呼ぶことでルールをi番目に変更する
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const currentRule = rules[currentRuleIndex] ?? DEFAULT_RULE_DEF;

  // この関数を呼び出すとゲームが始まる（1局）
  const startGame = () => dispatch({ type: 'START_GAME', rule: currentRule });
  /**
   * この関数を呼ぶと牌を切る
   * @param tileId 切る牌のID
   */
  const discard = (tileId: string) => dispatch({ type: 'DISCARD', tileId });
  const declareReach = () => dispatch({ type: 'DECLARE_REACH' });
  const setEvaluationTarget = (value: number) => {
    const normalized = Number.isFinite(value)
      ? Math.max(1, Math.floor(value))
      : 1;
    setEvaluation((prev) => ({ ...prev, targetGames: normalized }));
  };
  const setEvaluationSpeed = (mode: EvaluationSpeedMode) => {
    setEvaluation((prev) => ({ ...prev, speedMode: mode }));
  };
  const startEvaluation = () => {
    lastPhaseRef.current = null;
    setEvaluation((prev) => ({
      ...INITIAL_EVALUATION,
      targetGames: prev.targetGames,
      speedMode: prev.speedMode,
      rule: currentRule,
      isRunning: true,
    }));
  };

  return {
    state,
    statusText,
    currentRule,
    evaluations,
    canStart,
    canDiscard,
    canReach,
    declareReach,
    allowedDiscardIds,
    rules,
    currentRuleIndex,
    setCurrentRuleIndex, // ルール変更 setCurrentRuleIndex(i)
    startGame, // ゲーム開始 startGame()
    discard, // 牌を切る discard(tileId)
    aiStrategies: AI_STRATEGIES,
    playerStrategyIds,
    setPlayerStrategyIds,
    evaluation,
    setEvaluationTarget,
    setEvaluationSpeed,
    startEvaluation,
  };
}
