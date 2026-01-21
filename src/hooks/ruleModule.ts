/* eslint-disable @typescript-eslint/no-explicit-any */

import rawRule from 'rule.json';

type TileRule = {
  id: string;
  label: string;
  colorId: string;
  colorCode: string;
  copies: number;
};

export type YakuRule = {
  id: string;
  name: string;
  required: {
    color?: string;
    name?: string;
    count: number;
  }[];
  point: number;
};

export type RuleDefinition = {
  name: string;
  handSize: number;
  winHandSize?: number;
  initialScore: number;
  tiles: TileRule[];
  yakus: YakuRule[];
};

// JSONから読めなかったとき用
const DEFAULT_RULE: RuleDefinition = {
  name: 'Default ',
  handSize: 8,
  winHandSize: 9,
  initialScore: 5,
  tiles: [
    {
      id: 'red',
      label: 'Red',
      colorId: 'red',
      colorCode: '#e34b4b',
      copies: 12,
    },
    {
      id: 'blue',
      label: 'Blue',
      colorId: 'blue',
      colorCode: '#3a6fe2',
      copies: 12,
    },
    {
      id: 'green',
      label: 'Green',
      colorId: 'green',
      colorCode: '#3ca36b',
      copies: 12,
    },
    {
      id: 'yellow',
      label: 'Yellow',
      colorId: 'yellow',
      colorCode: '#e2b93b',
      copies: 12,
    },
  ],
  yakus: [
    {
      id: 'triple-sets-3',
      name: 'Triple Sets x3',
      required: [
        {
          color: 'any',
          count: 3,
        },
      ],
      point: 1,
    },
  ],
};

function normalizeRule(raw: Partial<RuleDefinition>): RuleDefinition {
  const name = raw.name ?? DEFAULT_RULE.name;
  const tiles =
    raw.tiles && raw.tiles.length > 0 ? raw.tiles : DEFAULT_RULE.tiles;
  const handSize = raw.handSize ?? DEFAULT_RULE.handSize;
  const winHandSize = raw.winHandSize ?? handSize + 1;
  const initialScore = raw.initialScore ?? DEFAULT_RULE.initialScore;
  const yakus =
    raw.yakus && raw.yakus.length > 0 ? raw.yakus : DEFAULT_RULE.yakus;
  return {
    name,
    handSize,
    winHandSize,
    initialScore,
    tiles,
    yakus,
  };
}

function toRuleDefinitions(raw: unknown): RuleDefinition[] {
  const rawRule: Partial<RuleDefinition>[] = readJSON(raw);

  const normalized = rawRule
    .flatMap((r) => {
      if (r && typeof r === 'object' && 'body' in r && 'name' in r) {
        const body = (r as { body?: Partial<RuleDefinition> }).body ?? {};
        return [normalizeRule({ name: r.name, ...body })];
      }

      return [normalizeRule(r)];
    })
    .filter((r): r is RuleDefinition => r !== undefined);

  return normalized.length > 0 ? normalized : [normalizeRule(DEFAULT_RULE)];
}

function readJSON(raw: unknown): Partial<RuleDefinition>[] {
  if (Array.isArray(raw)) {
    return raw.filter(isObject) as Partial<RuleDefinition>[];
  }

  if (isObject(raw)) {
    if (Array.isArray((raw as any).rules)) {
      return (raw as any).rules.filter(isObject) as Partial<RuleDefinition>[];
    }
  }

  return [];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object';
}

export const rules: RuleDefinition[] = toRuleDefinitions(rawRule);
