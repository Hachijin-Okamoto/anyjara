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
  wins: Record<PlayerId, number>;
  totalWinPoints: Record<PlayerId, number>;
  draws: number;
  rule: RuleDefinition;
};

export type GameState = {
  wall: Tile[];
  hands: Record<PlayerId, Tile[]>;
  discards: Record<PlayerId, Tile[]>;
  lastTsumo: Record<PlayerId, string | null>;
  isTempai: Record<PlayerId, boolean>;
  isReached: Record<PlayerId, boolean>;
  score: Record<PlayerId, number>;
  turn: PlayerId;
  phase: Phase;
  log: string[];
  rule: RuleDefinition;
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
  | { type: 'DISCARD'; tileId: string };

const DEFAULT_RULE_DEF = rules[0];

const PLAYER_IDS: PlayerId[] = [0, 1, 2, 3];
export const HUMAN: PlayerId = 0;

const PLAYER_STRATEGIES_DEFAULT: Record<PlayerId, string> = {
  0: 'human',
  1: 'yaku-progress',
  2: 'yaku-progress',
  3: 'yaku-progress',
};

const EVALUATION_STRATEGY_IDS: Record<PlayerId, string> = {
  0: 'yaku-progress',
  1: 'random',
  2: 'random',
  3: 'random',
};

const NON_HUMAN_STRATEGIES = AI_STRATEGIES.filter(
  (strategy) => strategy.id !== 'human',
);
const DEFAULT_AI_STRATEGY = NON_HUMAN_STRATEGIES[0] ?? AI_STRATEGIES[0];

const INITIAL_EVALUATION: EvaluationState = {
  isRunning: false,
  targetGames: 100,
  totalGames: 0,
  wins: { 0: 0, 1: 0, 2: 0, 3: 0 },
  totalWinPoints: { 0: 0, 1: 0, 2: 0, 3: 0 },
  draws: 0,
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
  score: { 0: 0, 1: 0, 2: 0, 3: 0 },
  turn: 0,
  phase: 'idle',
  log: ['「Start Game」で開始'],
  rule: DEFAULT_RULE_DEF,
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

function nextPlayer(turn: PlayerId): PlayerId {
  const idx = PLAYER_IDS.indexOf(turn);
  const next = (idx + 1) % PLAYER_IDS.length;
  return PLAYER_IDS[next];
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
        isTempai: { 0: false, 1: false, 2: false, 3: false },
        isReached: { 0: false, 1: false, 2: false, 3: false },
        score: {
          0: action.rule.initialScore,
          1: action.rule.initialScore,
          2: action.rule.initialScore,
          3: action.rule.initialScore,
        },
        turn: 0,
        phase: 'draw',
        log: ['ゲーム開始。P0（あなた）から。自動で1枚引きます。'],
        rule,
        winInfo: null,
      };
    }

    case 'DRAW': {
      if (state.phase !== 'draw') return state;

      const { tile, wall } = drawOne(state.wall);
      if (!tile) {
        return {
          ...state,
          phase: 'end',
          winInfo: null,
          log: [...state.log, '山が尽きました。ゲーム終了。'],
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
        return {
          ...state,
          wall,
          hands: { ...state.hands, [p]: newHand },
          lastTsumo: { ...state.lastTsumo, [p]: tile.id },
          phase: 'end',
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
            'ゲーム終了。',
          ],
        };
      }

      return {
        ...state,
        wall,
        hands: { ...state.hands, [p]: newHand },
        lastTsumo: { ...state.lastTsumo, [p]: tile.id },
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
      const idx = hand.findIndex((t) => t.id === action.tileId);
      if (idx < 0) return state;

      const tile = hand[idx];
      const newHand = [...hand.slice(0, idx), ...hand.slice(idx + 1)];
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
        return {
          ...state,
          hands: {
            ...state.hands,
            [p]: sortHand(newHand),
            [winner]: winnerHand,
          },
          discards: { ...state.discards, [p]: [...state.discards[p], tile] },
          lastTsumo: { ...state.lastTsumo, [winner]: tile.id, [p]: null },
          phase: 'end',
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
            'ゲーム終了。',
          ],
        };
      }

      const next = nextPlayer(p);

      return {
        ...state,
        hands: { ...state.hands, [p]: sortHand(newHand) },
        discards: { ...state.discards, [p]: [...state.discards[p], tile] },
        lastTsumo: { ...state.lastTsumo, [p]: null },
        turn: next,
        phase: 'draw',
        log: [...state.log, `P${p} が ${tile.label} を捨てた。P${next} の番。`],
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
  const evaluationDelayRef = useRef(false);
  const evaluationTimerRef = useRef<number | null>(null);

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

  /* ゲームを自動で動かす部分 */
  useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'end') return undefined;

    if (state.phase === 'draw') {
      const timer = window.setTimeout(() => {
        dispatch({ type: 'DRAW' });
      }, 300);
      return () => window.clearTimeout(timer);
    }

    const isHumanTurn =
      state.turn === HUMAN && playerStrategyIds[HUMAN] === 'human';
    if (state.phase === 'discard' && !isHumanTurn) {
      const hand = state.hands[state.turn];
      if (hand.length === 0) return undefined;
      const strategy = getStrategyById(playerStrategyIds[state.turn]);
      const tileId = strategy.decideDiscard(hand, state.rule);
      if (!tileId) return undefined;
      const timer = window.setTimeout(() => {
        dispatch({ type: 'DISCARD', tileId });
      }, 500);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [state.phase, state.turn, state.hands, state.rule, playerStrategyIds]);

  useEffect(() => {
    if (!evaluation.isRunning) {
      evaluationDelayRef.current = false;
      if (evaluationTimerRef.current !== null) {
        window.clearTimeout(evaluationTimerRef.current);
        evaluationTimerRef.current = null;
      }
      return undefined;
    }

    const phase = state.phase;
    const lastPhase = lastPhaseRef.current;
    lastPhaseRef.current = phase;

    if (phase === 'end' && lastPhase !== 'end') {
      if (state.winInfo) {
        evaluationDelayRef.current = true;
        if (evaluationTimerRef.current !== null) {
          window.clearTimeout(evaluationTimerRef.current);
        }
        evaluationTimerRef.current = window.setTimeout(() => {
          evaluationDelayRef.current = false;
          setEvaluation((prev) => {
            if (!prev.isRunning) return prev;
            const wins = { ...prev.wins };
            const totalWinPoints = { ...prev.totalWinPoints };
            const draws = prev.draws;
            wins[state.winInfo!.playerId] += 1;
            totalWinPoints[state.winInfo!.playerId] += state.winInfo!.points;
            const totalGames = prev.totalGames + 1;
            const isRunning = totalGames < prev.targetGames;
            const next = {
              ...prev,
              totalGames,
              wins,
              totalWinPoints,
              draws,
              isRunning,
            };
            if (next.isRunning && next.totalGames < next.targetGames) {
              dispatch({ type: 'START_GAME', rule: next.rule });
            }
            return next;
          });
        }, 5000);
        return () => {
          if (evaluationTimerRef.current !== null) {
            window.clearTimeout(evaluationTimerRef.current);
            evaluationTimerRef.current = null;
          }
          evaluationDelayRef.current = false;
        };
      }
      setEvaluation((prev) => {
        if (!prev.isRunning) return prev;
        const wins = { ...prev.wins };
        const totalWinPoints = { ...prev.totalWinPoints };
        let draws = prev.draws;
        if (state.winInfo) {
          wins[state.winInfo.playerId] += 1;
          totalWinPoints[state.winInfo.playerId] += state.winInfo.points;
        } else {
          draws += 1;
        }
        const totalGames = prev.totalGames + 1;
        const isRunning = totalGames < prev.targetGames;
        return { ...prev, totalGames, wins, totalWinPoints, draws, isRunning };
      });
    }

    if (
      !evaluationDelayRef.current &&
      evaluation.totalGames < evaluation.targetGames &&
      (phase === 'idle' || phase === 'end')
    ) {
      dispatch({ type: 'START_GAME', rule: evaluation.rule });
    }
  }, [
    evaluation.isRunning,
    evaluation.targetGames,
    evaluation.totalGames,
    evaluation.rule,
    state.phase,
    state.winInfo,
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
  const setEvaluationTarget = (value: number) => {
    const normalized = Number.isFinite(value)
      ? Math.max(1, Math.floor(value))
      : 1;
    setEvaluation((prev) => ({ ...prev, targetGames: normalized }));
  };
  const startEvaluation = () => {
    setPlayerStrategyIds(EVALUATION_STRATEGY_IDS);
    if (evaluationTimerRef.current !== null) {
      window.clearTimeout(evaluationTimerRef.current);
      evaluationTimerRef.current = null;
    }
    evaluationDelayRef.current = false;
    lastPhaseRef.current = null;
    setEvaluation((prev) => ({
      ...INITIAL_EVALUATION,
      targetGames: prev.targetGames,
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
    startEvaluation,
  };
}
