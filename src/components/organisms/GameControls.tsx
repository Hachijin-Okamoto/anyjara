import ActionButton from '@/components/atoms/ActionButton';
import { type PlayerId } from '@/hooks/useGame';
import { type RuleDefinition } from '@hooks/ruleModule';

type GameControlsProps = {
  canStart: boolean;
  wallCount: number;
  onStart: () => void;
  rules: RuleDefinition[];
  selectedRuleIndex: number;
  onSelectRule: (index: number) => void;
  aiStrategies: { id: string; name: string }[];
  playerStrategyIds: Record<PlayerId, string>;
  onSelectPlayerStrategy: (playerId: PlayerId, strategyId: string) => void;
};

export default function GameControls({
  canStart,
  wallCount,
  onStart,
  rules,
  selectedRuleIndex,
  onSelectRule,
  aiStrategies,
  playerStrategyIds,
  onSelectPlayerStrategy,
}: GameControlsProps) {
  const playerIds: PlayerId[] = [0, 1, 2, 3];
  const availableStrategies = (playerId: PlayerId) =>
    playerId === 0
      ? aiStrategies
      : aiStrategies.filter((strategy) => strategy.id !== 'human');

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#444', fontWeight: 600 }}>ルール</span>
        <select
          value={selectedRuleIndex}
          onChange={(event) => onSelectRule(Number(event.target.value))}
          disabled={!canStart}
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: canStart ? 'white' : '#f5f5f5',
            minWidth: 180,
          }}
        >
          {rules.map((rule, index) => (
            <option key={`${rule.name}-${index}`} value={index}>
              {rule.name}
            </option>
          ))}
        </select>
      </label>
      {playerIds.map((playerId) => (
        <label
          key={`strategy-${playerId}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span style={{ color: '#444', fontWeight: 600 }}>
            P{playerId}戦略
          </span>
          <select
            value={playerStrategyIds[playerId]}
            onChange={(event) =>
              onSelectPlayerStrategy(playerId, event.target.value)
            }
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: 'white',
              minWidth: 180,
            }}
          >
            {availableStrategies(playerId).map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </label>
      ))}
      <ActionButton onClick={onStart} disabled={!canStart}>
        Start Game
      </ActionButton>
      <div style={{ marginLeft: 'auto', color: '#333' }}>
        山: <b>{wallCount}</b>
      </div>
    </div>
  );
}
