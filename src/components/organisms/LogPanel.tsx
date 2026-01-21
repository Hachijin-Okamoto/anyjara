import ActionButton from '@/components/atoms/ActionButton';
import { type EvaluationState, type PlayerId } from '@/hooks/useGame';

type LogPanelProps = {
  log: string[];
  evaluation: EvaluationState;
  onSetEvaluationTarget: (value: number) => void;
  onStartEvaluation: () => void;
};

export default function LogPanel({
  log,
  evaluation,
  onSetEvaluationTarget,
  onStartEvaluation,
}: LogPanelProps) {
  const playerIds: PlayerId[] = [0, 1, 2, 3];
  const totalGames = evaluation.totalGames;
  const progressText = evaluation.isRunning
    ? `実行中: ${totalGames}/${evaluation.targetGames}`
    : `結果: ${totalGames}/${evaluation.targetGames}`;

  return (
    <section
      style={{
        border: '1px solid #eee',
        borderRadius: 16,
        padding: 14,
        background: 'white',
      }}
    >
      <h2 style={{ margin: '0 0 10px 0' }}>Log</h2>
      <div
        style={{
          maxHeight: 220,
          overflow: 'auto',
          border: '1px solid #f0f0f0',
          borderRadius: 12,
          padding: 10,
          background: '#fafafa',
          whiteSpace: 'pre-wrap',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
        }}
      >
        {log.slice(-50).join('\n')}
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px dashed #eee',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>課題評価</h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#444', fontWeight: 600 }}>試行回数</span>
            <input
              type="number"
              min={1}
              value={evaluation.targetGames}
              disabled={evaluation.isRunning}
              onChange={(event) =>
                onSetEvaluationTarget(Number(event.target.value))
              }
              style={{
                width: 120,
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #ddd',
              }}
            />
          </label>
          <ActionButton
            onClick={onStartEvaluation}
            disabled={evaluation.isRunning}
          >
            連続実行
          </ActionButton>
          <span style={{ color: '#666', fontSize: 13 }}>
            P0: 役優先 / P1-3: ランダム
          </span>
        </div>
        <div style={{ color: '#444', marginBottom: 10 }}>{progressText}</div>
        <div style={{ color: '#666', marginBottom: 12 }}>
          引き分け: {evaluation.draws}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
          }}
        >
          {playerIds.map((playerId) => {
            const wins = evaluation.wins[playerId];
            const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
            const avgPoints =
              wins > 0 ? evaluation.totalWinPoints[playerId] / wins : 0;
            return (
              <div
                key={`eval-player-${playerId}`}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: 10,
                  background: '#fafafa',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  P{playerId}
                </div>
                <div>勝率: {winRate.toFixed(1)}%</div>
                <div>平均点: {avgPoints.toFixed(1)}</div>
                <div>勝利数: {wins}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
