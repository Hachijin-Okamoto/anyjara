import { type RuleDefinition } from '@/hooks/ruleModule';

type RulesPanelProps = {
  rule: RuleDefinition;
};

export default function RulesPanel({ rule }: RulesPanelProps) {
  return (
    <section
      style={{
        border: '1px solid #eee',
        borderRadius: 16,
        padding: 14,
        background: 'white',
      }}
    >
      <h2 style={{ margin: '0 0 10px 0' }}>Rules</h2>
      <div style={{ marginBottom: 10, color: '#555' }}>
        適用ルール: <b>{rule.name}</b>
      </div>
      <div style={{ marginBottom: 10, color: '#555' }}>
        初期手札: {rule.handSize} / 勝利手札:{' '}
        {rule.winHandSize ?? rule.handSize + 1}
      </div>

      <div style={{ marginBottom: 10 }}>
        色と枚数:
        <div
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}
        >
          {rule.tiles.map((c) => (
            <div
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: c.colorCode,
                  display: 'inline-block',
                  border: '1px solid #ddd',
                }}
              />
              <span style={{ color: '#555' }}>
                {c.label} x{c.copies}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ color: '#555' }}>
        役:
        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
          {rule.yakus.map((yakuRule) => (
            <div
              key={yakuRule.id}
              style={{ alignItems: 'center', gap: 8, marginRight: 12 }}
            >
              <span>{yakuRule.name}</span>
              <span style={{ color: '#999' }}>+{yakuRule.point}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
