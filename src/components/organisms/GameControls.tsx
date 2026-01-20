import ActionButton from '@/components/atoms/ActionButton';
import { type RuleDefinition } from '@/hooks/useGame';

type GameControlsProps = {
  canStart: boolean;
  wallCount: number;
  onStart: () => void;
  rules: RuleDefinition[];
  selectedRuleIndex: number;
  onSelectRule: (index: number) => void;
};

export default function GameControls({
  canStart,
  wallCount,
  onStart,
  rules,
  selectedRuleIndex,
  onSelectRule,
}: GameControlsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16,
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
            <option key={`${rule.ruleName}-${index}`} value={index}>
              {rule.ruleName}
            </option>
          ))}
        </select>
      </label>
      <ActionButton onClick={onStart} disabled={!canStart}>
        Start Game
      </ActionButton>
      <div style={{ marginLeft: 'auto', color: '#333' }}>
        山: <b>{wallCount}</b>
      </div>
    </div>
  );
}
