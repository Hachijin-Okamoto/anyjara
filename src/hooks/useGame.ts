import { useEffect, useMemo, useReducer } from 'react';

import { type Tile } from '@/entity/Tile';
import rawRuleConfig from '../../rule.json';

export type PlayerId = 0 | 1 | 2 | 3;

type Phase = 'idle' | 'draw' | 'discard' | 'end';

type ColorRule = {
  id: string;
  label: string;
  color: string;
  copies: number;
};

type YakuRule = {
  id: string;
  name: string;
  type: 'set-of-three';
  color: 'any' | string;
  setsRequired: number;
  points: number;
};

export type RuleConfig = {
  handSize: number;
  winHandSize?: number;
  colors: ColorRule[];
  yaku: YakuRule[];
  win: {
    minPoints: number;
  };
};

export type YakuResult = {
  id: string;
  name: string;
  points: number;
  achieved: boolean;
};

export type YakuEvaluation = {
  results: YakuResult[];
  points: number;
  totalSets: number;
};

export type GameState = {
  wall: Tile[];
  hands: Record<PlayerId, Tile[]>;
  discards: Record<PlayerId, Tile[]>;
  lastDrawn: Record<PlayerId, string | null>;
  turn: PlayerId;
  phase: Phase;
  log: string[];
};

type Action =
  | { type: 'START_GAME' }
  | { type: 'DRAW' }
  | { type: 'DISCARD'; tileId: string };

const DEFAULT_RULE: RuleConfig = {
  handSize: 8,
  winHandSize: 9,
  colors: [
    { id: 'red', label: 'Red', color: '#e34b4b', copies: 12 },
    { id: 'blue', label: 'Blue', color: '#3a6fe2', copies: 12 },
    { id: 'green', label: 'Green', color: '#3ca36b', copies: 12 },
    { id: 'yellow', label: 'Yellow', color: '#e2b93b', copies: 12 },
  ],
  yaku: [
    {
      id: 'triple-sets-3',
      name: 'Triple Sets x3',
      type: 'set-of-three',
      color: 'any',
      setsRequired: 3,
      points: 3,
    },
  ],
  win: { minPoints: 3 },
};

export const RULE: RuleConfig = (() => {
  const raw = rawRuleConfig as Partial<RuleConfig>;
  const colors =
    raw.colors && raw.colors.length > 0 ? raw.colors : DEFAULT_RULE.colors;
  const handSize = raw.handSize ?? DEFAULT_RULE.handSize;
  const winHandSize = raw.winHandSize ?? handSize + 1;
  const yaku = raw.yaku && raw.yaku.length > 0 ? raw.yaku : DEFAULT_RULE.yaku;
  const minPoints = raw.win?.minPoints ?? DEFAULT_RULE.win.minPoints;
  return {
    handSize,
    winHandSize,
    colors,
    yaku,
    win: { minPoints },
  };
})();

const PLAYER_IDS: PlayerId[] = [0, 1, 2, 3];
export const HUMAN: PlayerId = 0;

const INITIAL: GameState = {
  wall: [],
  hands: { 0: [], 1: [], 2: [], 3: [] },
  discards: { 0: [], 1: [], 2: [], 3: [] },
  lastDrawn: { 0: null, 1: null, 2: null, 3: null },
  turn: 0,
  phase: 'idle',
  log: ['「Start Game」で開始'],
};

function makeWall(rule: RuleConfig): Tile[] {
  const tiles: Tile[] = [];
  for (const c of rule.colors) {
    for (let i = 1; i <= c.copies; i++) {
      tiles.push({
        id: `${c.id}-${i}`,
        kind: c.id,
        label: c.label,
        color: c.color,
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

function drawOne(wall: Tile[]): { tile: Tile | null; wall: Tile[] } {
  if (wall.length === 0) return { tile: null, wall };
  const [top, ...rest] = wall;
  return { tile: top, wall: rest };
}

function sortHand(hand: Tile[]): Tile[] {
  const key = (t: Tile) => `${t.label}-${t.id}`;
  return [...hand].sort((x, y) => key(x).localeCompare(key(y)));
}

function evaluateYaku(hand: Tile[], rule: RuleConfig): YakuEvaluation {
  const counts = new Map<string, number>();
  for (const t of hand) {
    counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
  }

  let totalSets = 0;
  for (const c of counts.values()) {
    totalSets += Math.floor(c / 3);
  }

  const results = rule.yaku.map((yaku) => {
    if (yaku.type === 'set-of-three') {
      const sets =
        yaku.color === 'any'
          ? totalSets
          : Math.floor((counts.get(yaku.color) ?? 0) / 3);
      const achieved = sets >= yaku.setsRequired;
      return {
        id: yaku.id,
        name: yaku.name,
        points: yaku.points,
        achieved,
      };
    }
    return {
      id: yaku.id,
      name: yaku.name,
      points: yaku.points,
      achieved: false,
    };
  });

  const points = results.reduce(
    (sum, r) => (r.achieved ? sum + r.points : sum),
    0,
  );

  return { results, points, totalSets };
}

function canWin(
  hand: Tile[],
  rule: RuleConfig,
): { achieved: boolean; points: number; results: YakuResult[] } {
  const evaluation = evaluateYaku(hand, rule);
  const hasSize = hand.length >= (rule.winHandSize ?? rule.handSize + 1);
  const achieved = hasSize && evaluation.points >= rule.win.minPoints;
  return { achieved, points: evaluation.points, results: evaluation.results };
}

function nextPlayer(turn: PlayerId): PlayerId {
  const idx = PLAYER_IDS.indexOf(turn);
  const next = (idx + 1) % PLAYER_IDS.length;
  return PLAYER_IDS[next];
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const wall = shuffle(makeWall(RULE));
      let w = wall;
      const hands: Record<PlayerId, Tile[]> = { 0: [], 1: [], 2: [], 3: [] };
      for (let i = 0; i < RULE.handSize; i++) {
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
        lastDrawn: { 0: null, 1: null, 2: null, 3: null },
        turn: 0,
        phase: 'draw',
        log: ['ゲーム開始。P0（あなた）から。自動で1枚引きます。'],
      };
    }

    case 'DRAW': {
      if (state.phase !== 'draw') return state;

      const { tile, wall } = drawOne(state.wall);
      if (!tile) {
        return {
          ...state,
          phase: 'end',
          log: [...state.log, '山が尽きました。ゲーム終了。'],
        };
      }

      const p = state.turn;
      const newHand = sortHand([...state.hands[p], tile]);
      const winCheck = canWin(newHand, RULE);
      if (winCheck.achieved) {
        const yakuNames = winCheck.results
          .filter((r) => r.achieved)
          .map((r) => r.name)
          .join(', ');
        return {
          ...state,
          wall,
          hands: { ...state.hands, [p]: newHand },
          lastDrawn: { ...state.lastDrawn, [p]: tile.id },
          phase: 'end',
          log: [
            ...state.log,
            `P${p} が ${tile.label} を引いた。役成立！得点 ${winCheck.points}。`,
            `成立役: ${yakuNames || 'なし'}`,
            'ゲーム終了。',
          ],
        };
      }

      return {
        ...state,
        wall,
        hands: { ...state.hands, [p]: newHand },
        lastDrawn: { ...state.lastDrawn, [p]: tile.id },
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
      const next = nextPlayer(p);

      return {
        ...state,
        hands: { ...state.hands, [p]: sortHand(newHand) },
        discards: { ...state.discards, [p]: [...state.discards[p], tile] },
        lastDrawn: { ...state.lastDrawn, [p]: null },
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

  const canStart = state.phase === 'idle' || state.phase === 'end';
  const canDiscard = state.phase === 'discard' && state.turn === HUMAN;

  const evaluation = useMemo(
    () => evaluateYaku(state.hands[HUMAN], RULE),
    [state.hands],
  );
  const winTarget = RULE.win.minPoints;

  const statusText = useMemo(() => {
    if (state.phase === 'idle') return 'Start Game で開始';
    if (state.phase === 'end') return '終了（Start Game で再開）';
    return `手番: P${state.turn} / フェーズ: ${state.phase}`;
  }, [state.phase, state.turn]);

  useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'end') return undefined;

    if (state.phase === 'draw') {
      const timer = window.setTimeout(() => {
        dispatch({ type: 'DRAW' });
      }, 300);
      return () => window.clearTimeout(timer);
    }

    if (state.phase === 'discard' && state.turn !== HUMAN) {
      const hand = state.hands[state.turn];
      if (hand.length === 0) return undefined;
      const idx = Math.floor(Math.random() * hand.length);
      const tileId = hand[idx].id;
      const timer = window.setTimeout(() => {
        dispatch({ type: 'DISCARD', tileId });
      }, 500);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [state.phase, state.turn, state.hands]);

  const startGame = () => dispatch({ type: 'START_GAME' });
  const discard = (tileId: string) => dispatch({ type: 'DISCARD', tileId });

  return {
    state,
    statusText,
    evaluation,
    winTarget,
    canStart,
    canDiscard,
    startGame,
    discard,
  };
}
